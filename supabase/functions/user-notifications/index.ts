  import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
  const sendWhatsApp = async (phone: string, message: string) => {
    const url = Deno.env.get('WHATSAPP_API_URL')
    const key = Deno.env.get('WHATSAPP_API_KEY')
    if (!url || !key || !phone) return
    
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({
          number: phone.replace(/\D/g, ''),
          message: message
        })
      })
    } catch (e) {
      console.error('WhatsApp error:', e)
    }
  }

  const sendSMS = async (phone: string, message: string) => {
    const key = Deno.env.get('SMS_API_KEY')
    if (!key || !phone) return
    // SMS implementation would go here (e.g., Twilio)
    console.log('SMS would be sent to', phone, ':', message)
  }

  import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 }
 
 serve(async (req: Request) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders })
   }
 
   try {
     const supabaseClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_ANON_KEY') ?? '',
       { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
     )
 
      const authHeader = req.headers.get('Authorization')!;
      const isServiceRole = authHeader.includes(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'never-match-this-default');

      let authUser = null;
      let profileRole = null;

      if (!isServiceRole) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        )
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
        if (authError || !user) throw new Error('Unauthorized')
        authUser = user;

        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        profileRole = profile;
      }

      const { userId, type, data, userEmail, lotId, title, message } = await req.json()
      
      // Permissions check: only admins (or service role) can send notifications (except for certain types if allowed)
      if (!isServiceRole && profileRole?.role !== 'admin' && !['offer_received', 'direct_sale_request', 'outbid'].includes(type)) {
        throw new Error('Forbidden')
      }

      const adminClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

      const logNotification = async (type: string, title: string, message: string, email: string, status: string, error_details?: string) => {
        await adminClient.from('notification_logs').insert({ type, title, message, recipient_email: email, status, error_details })
      }

      const isRateLimited = async (email: string, type: string) => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data, error } = await adminClient
          .from('notification_logs')
          .select('id')
          .eq('recipient_email', email)
          .eq('type', type)
          .eq('status', 'sent')
          .gt('created_at', fiveMinutesAgo)
          .limit(1)
        
        if (error) {
          console.error('Error checking rate limit:', error)
          return false
        }
        return data && data.length > 0
      }

      let email = userEmail;
      let phone = '';
      let profileData = null;

      if (userId) {
        const { data: { user } } = await adminClient.auth.admin.getUserById(userId)
        if (user) email = user.email
        
        const { data: profile } = await adminClient
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        profileData = profile
        phone = profile?.phone || ''
      }

     const resendKey = Deno.env.get('RESEND_API_KEY')
      const sendEmail = async (to: string[], subject: string, html: string, from: string = 'Elite Leilões <contato@premiumagro.com.br>', notificationType?: string) => {
        const targetType = notificationType || type;
        
        // Rate limit check
        for (const recipient of to) {
          if (await isRateLimited(recipient, targetType)) {
            console.log(`Rate limited: ${targetType} to ${recipient}`)
            await logNotification(targetType, subject, html, recipient, 'rate_limited')
            return { success: false, reason: 'rate_limited' }
          }
        }

        if (!resendKey) {
          console.warn('RESEND_API_KEY not found. Logging instead of sending.')
          await logNotification(targetType, subject, html, to.join(','), 'simulated_no_key')
          return { success: false, reason: 'no_key' }
        }
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
          body: JSON.stringify({ from, to, subject, html }),
        })
        if (res.ok) {
          await logNotification(targetType, subject, html, to.join(','), 'sent')
          return { success: true }
        } else {
          const errData = await res.text();
          await logNotification(targetType, subject, html, to.join(','), 'failed', errData)
          return { success: false, reason: 'api_error', details: errData }
        }
      }

      if (type === 'user_approved' && email) {
        await sendEmail([email], 'Seu cadastro foi aprovado! 🚀', `<div style="font-family: sans-serif; padding: 20px;"><h2>Olá! Seu cadastro foi aprovado.</h2><p>Você já pode participar dos leilões.</p></div>`)
        if (phone) {
          await sendWhatsApp(phone, `🚀 *Elite Leilões: Seu cadastro foi aprovado!*\n\nOlá! Seu cadastro foi aprovado com sucesso. Você já pode participar de todos os nossos leilões e realizar lances.\n\nBoas compras!`)
        }
      } else if (type === 'offer_received' || type === 'direct_sale_request') {
       const { amount, itemName, bidderName } = data;
       const { data: admins } = await adminClient.from('profiles').select('id').eq('role', 'admin');
       if (admins) {
         for (const admin of admins) {
           const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(admin.id);
            if (adminUser?.email) {
              await sendEmail(
                [adminUser.email], 
                type === 'offer_received' ? 'Nova Proposta Recebida! 💰' : 'Novo Interesse de Compra! 🛒',
                `<div style="font-family: sans-serif; padding: 20px;"><h2>Novo interesse em: ${itemName}</h2><p>Valor: R$ ${amount.toLocaleString('pt-BR')}</p><p>Por: ${bidderName}</p></div>`
              )
            }
         }
       }
      } else if ((type === 'offer_status_update' || type === 'direct_sale_status_update') && email) {
       const { amount, itemName, status } = data;
        const statusLabel = status === 'approved' || status === 'confirmed' ? 'APROVADA/CONFIRMADA' : 'REJEITADA/CANCELADA';
        await sendEmail(
          [email],
          `Sua solicitação foi ${statusLabel.toLowerCase()}!`,
          `<div style="font-family: sans-serif; padding: 20px;"><h2>Status atualizado para: ${itemName}</h2><p>Novo status: ${statusLabel}</p><p>Valor: R$ ${amount.toLocaleString('pt-BR')}</p></div>`
        )
      } else if (type === 'security_alert') {
        const { data: admins } = await adminClient.from('profiles').select('id').eq('role', 'admin');
        if (admins) {
          for (const admin of admins) {
            const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(admin.id);
            if (adminUser?.email) {
              await sendEmail(
                [adminUser.email],
                `⚠️ ALERTA DE SEGURANÇA: ${title || 'Atividade Suspeita'}`,
                `
                  <div style="font-family: sans-serif; padding: 20px; border: 2px solid #dc2626; border-radius: 8px;">
                    <h2 style="color: #dc2626;">Alerta de Segurança Crítico</h2>
                    <p><strong>Evento:</strong> ${title}</p>
                    <p><strong>Descrição:</strong> ${message}</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">Este é um e-mail automático do sistema de auditoria da Elite Leilões.</p>
                    <a href="https://eliteleiloes.lovable.app/admin" style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">ACESSAR PAINEL</a>
                  </div>
                `,
                'Elite Leilões <seguranca@premiumagro.com.br>'
              )
            }
          }
        }
      } else if (type === 'outbid') {
         const { amount, lotNumber, animalName } = data;

         // WhatsApp Notification
         if (profileData?.pref_outbid_whatsapp !== false && phone) {
           const wsMessage = `📢 *Elite Leilões: Seu lance foi superado!*\n\nO lance no Lote #${lotNumber} (${animalName}) foi coberto.\nValor atual: R$ ${amount.toLocaleString('pt-BR')}\n\nClique para cobrir o lance:\nhttps://eliteleiloes.lovable.app/lotes/${lotId}`
           await sendWhatsApp(phone, wsMessage)
         }

         // SMS Notification
         if (profileData?.pref_outbid_sms && phone) {
           const smsMessage = `Elite Leilões: Seu lance no Lote #${lotNumber} foi superado! Valor: R$ ${amount.toLocaleString('pt-BR')}. Acesse: https://eliteleiloes.lovable.app/lotes/${lotId}`
           await sendSMS(phone, smsMessage)
         }

         // Email Notification
         if (email && profileData?.pref_outbid_email !== false) {
          await sendEmail(
            [email],
            'Seu lance foi superado! 📢',
            `... (omitted HTML for brevity) ...`
          )
       }
     }

     return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
   } catch (error) {
     return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
   }
 })
