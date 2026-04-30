 import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
 
     const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()
     if (authError || !authUser) throw new Error('Unauthorized')
 
     const { data: profileRole } = await supabaseClient
       .from('profiles')
       .select('role')
       .eq('id', authUser.id)
       .single()
 
     const { userId, type, data, userEmail } = await req.json()
     
     // Permissions check: only admins can send notifications (except for certain types if allowed)
     if (profileRole?.role !== 'admin' && !['offer_received', 'direct_sale_request'].includes(type)) {
       throw new Error('Forbidden')
     }
 
     const adminClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     )
 
     let email = userEmail;
     if (!email && userId) {
       const { data: { user } } = await adminClient.auth.admin.getUserById(userId)
       if (user) email = user.email
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
     }
 
     return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
   } catch (error) {
     return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
   }
 })
