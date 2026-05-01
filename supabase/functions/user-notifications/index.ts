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

     const adminClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     )
 
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
     if (!resendKey) {
       console.warn('RESEND_API_KEY not found. Email not sent.')
       return new Response(JSON.stringify({ success: true, message: 'Key missing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
     }

     if (type === 'user_approved' && email) {
       await fetch('https://api.resend.com/emails', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
         body: JSON.stringify({
           from: 'Elite Leilões <contato@premiumagro.com.br>',
           to: [email],
           subject: 'Seu cadastro foi aprovado! 🚀',
            html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Olá! Seu cadastro foi aprovado.</h2><p>Você já pode participar dos leilões.</p></div>`,
          }),
        })
        
        if (phone) {
          await sendWhatsApp(phone, `🚀 *Elite Leilões: Seu cadastro foi aprovado!*\n\nOlá! Seu cadastro foi aprovado com sucesso. Você já pode participar de todos os nossos leilões e realizar lances.\n\nBoas compras!`)
        }
     } else if ((type === 'offer_received' || type === 'direct_sale_request') && resendKey) {
       const { amount, itemName, bidderName } = data;
       const { data: admins } = await adminClient.from('profiles').select('id').eq('role', 'admin');
       if (admins) {
         for (const admin of admins) {
           const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(admin.id);
           if (adminUser?.email) {
             await fetch('https://api.resend.com/emails', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
               body: JSON.stringify({
                 from: 'Elite Leilões <contato@premiumagro.com.br>',
                 to: [adminUser.email],
                 subject: type === 'offer_received' ? 'Nova Proposta Recebida! 💰' : 'Novo Interesse de Compra! 🛒',
                 html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Novo interesse em: ${itemName}</h2><p>Valor: R$ ${amount.toLocaleString('pt-BR')}</p><p>Por: ${bidderName}</p></div>`,
               }),
             });
           }
         }
       }
     } else if ((type === 'offer_status_update' || type === 'direct_sale_status_update') && email && resendKey) {
       const { amount, itemName, status } = data;
       const statusLabel = status === 'approved' || status === 'confirmed' ? 'APROVADA/CONFIRMADA' : 'REJEITADA/CANCELADA';
       await fetch('https://api.resend.com/emails', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
         body: JSON.stringify({
           from: 'Elite Leilões <contato@premiumagro.com.br>',
           to: [email],
           subject: `Sua solicitação foi ${statusLabel.toLowerCase()}!`,
            html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Status atualizado para: ${itemName}</h2><p>Novo status: ${statusLabel}</p><p>Valor: R$ ${amount.toLocaleString('pt-BR')}</p></div>`,
          }),
        });
      } else if (type === 'security_alert' && resendKey) {
        const { data: admins } = await adminClient.from('profiles').select('id').eq('role', 'admin');
        if (admins) {
          for (const admin of admins) {
            const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(admin.id);
            if (adminUser?.email) {
              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
                body: JSON.stringify({
                  from: 'Elite Leilões <seguranca@premiumagro.com.br>',
                  to: [adminUser.email],
                  subject: `⚠️ ALERTA DE SEGURANÇA: ${title || 'Atividade Suspeita'}`,
                  html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 2px solid #dc2626; border-radius: 8px;">
                      <h2 style="color: #dc2626;">Alerta de Segurança Crítico</h2>
                      <p><strong>Evento:</strong> ${title}</p>
                      <p><strong>Descrição:</strong> ${message}</p>
                      <hr />
                      <p style="font-size: 12px; color: #666;">Este é um e-mail automático do sistema de auditoria da Elite Leilões.</p>
                      <a href="https://eliteleiloes.lovable.app/admin" style="display: inline-block; background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">ACESSAR PAINEL</a>
                    </div>
                  `,
                }),
              });
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
         if (email && resendKey && profileData?.pref_outbid_email !== false) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: 'Elite Leilões <contato@premiumagro.com.br>',
            to: [email],
            subject: 'Seu lance foi superado! 📢',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    .container { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; color: #1f2937; }
                    .header { background-color: #064e3b; padding: 32px 20px; text-align: center; }
                    .content { padding: 40px 32px; background-color: #ffffff; }
                    .footer { background-color: #f9fafb; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; }
                    .badge { display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #92400e; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; }
                    .title { font-size: 24px; font-weight: 800; color: #111827; margin: 0 0 16px 0; text-transform: uppercase; }
                    .price-box { background-color: #f3f4f6; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
                    .price-label { font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
                    .price-value { font-size: 32px; font-weight: 900; color: #064e3b; font-style: italic; }
                    .button { display: inline-block; background-color: #c5a059; color: #064e3b; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; transition: background-color 0.2s; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; text-align: left; }
                    .info-item { border-bottom: 1px solid #f3f4f6; padding-bottom: 8px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <img src="https://ccrslflbnxdazvadjlvj.supabase.co/storage/v1/object/public/public_assets/logo-0.9588475542778425.png" alt="Elite Leilões" style="height: 50px;">
                    </div>
                    <div class="content">
                      <div class="badge">Atenção Licitante</div>
                      <h1 class="title">Seu lance foi superado! 📢</h1>
                      <p style="font-size: 16px; line-height: 1.5; color: #4b5563;">
                        O seu lance no <strong>Lote #${lotNumber}</strong> foi coberto. Não deixe essa oportunidade passar!
                      </p>
                      
                      <div class="price-box">
                        <div class="price-label">Novo Lance Atual</div>
                        <div class="price-value">R$ ${amount.toLocaleString('pt-BR')}</div>
                      </div>

                      <div style="margin-bottom: 32px;">
                        <div class="info-item"><strong>Animal:</strong> ${animalName}</div>
                        <div class="info-item"><strong>Lote:</strong> #${lotNumber}</div>
                      </div>

                      <div style="text-align: center;">
                        <a href="https://eliteleiloes.lovable.app/lotes/${lotId}" class="button">Cobrir Lance Agora</a>
                      </div>
                    </div>
                    <div class="footer">
                      <p><strong>Elite Leilões - Premium Agro</strong></p>
                      <p>Este é um aviso automático gerado pelo sistema.</p>
                      <p style="margin-top: 16px;">Precisa de ajuda? <a href="https://wa.me/551140028922" style="color: #064e3b; font-weight: bold;">Fale conosco via WhatsApp</a></p>
                    </div>
                  </div>
                </body>
              </html>
            `,
         }),
       });
       }
     }

     return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
   } catch (error) {
     return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
   }
 })
