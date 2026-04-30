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
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get the user from the JWT
    const { data: { user: authUser }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !authUser) {
      throw new Error('Unauthorized')
    }

    // Check if the user is an admin
    const { data: profileRole } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (profileRole?.role !== 'admin') {
      throw new Error('Forbidden: Only admins can send notifications')
    }

     const { userId, type, data, userEmail } = await req.json()
    
    // Use service role for admin tasks
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch user profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      throw new Error('User not found')
    }

     let email = userEmail;
     
     if (!email && userId) {
       const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(userId)
       if (!userError && user) {
         email = user.email
       }
     }

     const resendKey = Deno.env.get('RESEND_API_KEY')
 
     if (type === 'user_approved' && email) {
      console.log(`Sending approval email to ${email}`)
      
       if (resendKey) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: 'Premium Agro Leilões <contato@premiumagro.com.br>',
            to: [email],
            subject: 'Seu cadastro foi aprovado! 🚀',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #064e3b; padding: 30px; text-align: center;">
                  <h1 style="color: #fbbf24; margin: 0; font-size: 24px; letter-spacing: 2px;">PREMIUM AGRO LEILÕES</h1>
                </div>
                <div style="padding: 30px; color: #374151; line-height: 1.6;">
                  <h2 style="color: #064e3b;">Olá, ${profile.full_name}!</h2>
                  <p>Temos o prazer de informar que seu cadastro foi <strong>aprovado</strong> pela nossa equipe de auditoria.</p>
                  <p>Agora você está oficialmente habilitado para participar de todos os nossos leilões e dar lances nos animais de elite.</p>
                  <div style="margin: 40px 0; text-align: center;">
                    <a href="https://agro-ncbrasil.lovable.app/ao-vivo" style="background-color: #fbbf24; color: #064e3b; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">IR PARA O LEILÃO AO VIVO</a>
                  </div>
                  <p style="font-size: 14px; color: #6b7280;">Se você não solicitou este cadastro, por favor ignore este e-mail.</p>
                  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                  <p style="margin: 0;">Bons negócios!</p>
                  <p style="margin: 0; font-weight: bold; color: #064e3b;">Equipe Premium Agro</p>
                </div>
                <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
                  &copy; 2026 Premium Agro Leilões. Todos os direitos reservados.
                </div>
              </div>
            `,
          }),
        })
        
        if (!res.ok) {
          const errorData = await res.json()
          console.error('Error sending email via Resend:', errorData)
     } else if ((type === 'offer_received' || type === 'direct_sale_request') && resendKey) {
       // Notify admins about new offer or purchase request
       const { amount, itemName, bidderName } = data;
       const subject = type === 'offer_received' ? 'Nova Proposta Recebida! 💰' : 'Novo Interesse de Compra! 🛒';
       const title = type === 'offer_received' ? 'Nova Proposta Recebida' : 'Novo Interesse de Compra';
       const actionLink = type === 'offer_received' ? 'https://agro-ncbrasil.lovable.app/admin' : 'https://agro-ncbrasil.lovable.app/admin';
       
       // Get all admin emails
       const { data: admins } = await adminClient
         .from('profiles')
         .select('id')
         .eq('role', 'admin');
 
       if (admins && admins.length > 0) {
         for (const admin of admins) {
           const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(admin.id);
           if (adminUser?.email) {
             await fetch('https://api.resend.com/emails', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${resendKey}`,
               },
               body: JSON.stringify({
                 from: 'Elite Leilões <contato@premiumagro.com.br>',
                 to: [adminUser.email],
                 subject: subject,
                 html: `
                   <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                     <div style="background-color: #064e3b; padding: 30px; text-align: center;">
                       <h1 style="color: #fbbf24; margin: 0; font-size: 24px; letter-spacing: 2px;">ELITE LEILÕES</h1>
                     </div>
                     <div style="padding: 30px; color: #374151; line-height: 1.6;">
                       <h2 style="color: #064e3b;">${title}</h2>
                       <p>Um novo interesse foi enviado para o item <strong>${itemName}</strong>.</p>
                       <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                         <p style="margin: 0; font-size: 14px; color: #6b7280;">Interessado:</p>
                         <p style="margin: 5px 0 15px 0; font-weight: bold; font-size: 18px;">${bidderName}</p>
                         <p style="margin: 0; font-size: 14px; color: #6b7280;">Valor:</p>
                         <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 24px; color: #059669;">R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                       </div>
                       <div style="margin: 40px 0; text-align: center;">
                         <a href="${actionLink}" style="background-color: #fbbf24; color: #064e3b; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">GERENCIAR PEDIDOS</a>
                       </div>
                     </div>
                   </div>
                 `,
               }),
             });
           }
         }
       }
     } else if (type === 'direct_sale_status_update' && email && resendKey) {
       // Notify buyer about status update
       const { amount, itemName, status } = data;
       const statusLabel = status === 'confirmed' ? 'CONFIRMADA' : 'CANCELADA';
       const statusColor = status === 'confirmed' ? '#059669' : '#dc2626';
 
       await fetch('https://api.resend.com/emails', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${resendKey}`,
         },
         body: JSON.stringify({
           from: 'Elite Leilões <contato@premiumagro.com.br>',
           to: [email],
           subject: `Sua solicitação de compra foi ${statusLabel.toLowerCase()}!`,
           html: `
             <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
               <div style="background-color: #064e3b; padding: 30px; text-align: center;">
                 <h1 style="color: #fbbf24; margin: 0; font-size: 24px; letter-spacing: 2px;">ELITE LEILÕES</h1>
               </div>
               <div style="padding: 30px; color: #374151; line-height: 1.6;">
                 <h2 style="color: #064e3b;">Status da sua Compra</h2>
                 <p>O status da sua solicitação para <strong>${itemName}</strong> foi atualizado.</p>
                 <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                   <p style="margin: 0; font-size: 14px; color: #6b7280;">Novo Status:</p>
                   <p style="margin: 10px 0; font-weight: bold; font-size: 24px; color: ${statusColor}; text-transform: uppercase;">${statusLabel}</p>
                   <p style="margin: 0; font-size: 14px; color: #6b7280;">Valor: R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                 </div>
                 <p>Nossa equipe entrará em contato em breve para os próximos passos.</p>
                 <p>Equipe Elite Leilões</p>
               </div>
             </div>
           `,
         }),
       });
     }
       // Notify admins about new offer
       const { amount, itemName, bidderName } = data;
       
       // Get all admin emails
       const { data: admins } = await adminClient
         .from('profiles')
         .select('id')
         .eq('role', 'admin');
 
       if (admins && admins.length > 0) {
         for (const admin of admins) {
           const { data: { user: adminUser } } = await adminClient.auth.admin.getUserById(admin.id);
           if (adminUser?.email) {
             await fetch('https://api.resend.com/emails', {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${resendKey}`,
               },
               body: JSON.stringify({
                 from: 'Elite Leilões <contato@premiumagro.com.br>',
                 to: [adminUser.email],
                 subject: 'Nova Proposta Recebida! 💰',
                 html: `
                   <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                     <div style="background-color: #064e3b; padding: 30px; text-align: center;">
                       <h1 style="color: #fbbf24; margin: 0; font-size: 24px; letter-spacing: 2px;">ELITE LEILÕES</h1>
                     </div>
                     <div style="padding: 30px; color: #374151; line-height: 1.6;">
                       <h2 style="color: #064e3b;">Nova Proposta Recebida</h2>
                       <p>Uma nova proposta foi enviada para o item <strong>${itemName}</strong>.</p>
                       <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                         <p style="margin: 0; font-size: 14px; color: #6b7280;">Proponente:</p>
                         <p style="margin: 5px 0 15px 0; font-weight: bold; font-size: 18px;">${bidderName}</p>
                         <p style="margin: 0; font-size: 14px; color: #6b7280;">Valor Ofertado:</p>
                         <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 24px; color: #059669;">R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                       </div>
                       <div style="margin: 40px 0; text-align: center;">
                         <a href="https://agro-ncbrasil.lovable.app/admin" style="background-color: #fbbf24; color: #064e3b; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">GERENCIAR PROPOSTAS</a>
                       </div>
                     </div>
                   </div>
                 `,
               }),
             });
           }
         }
       }
     } else if (type === 'offer_status_update' && email && resendKey) {
       // Notify bidder about status update
       const { amount, itemName, status } = data;
       const statusLabel = status === 'approved' ? 'APROVADA' : status === 'rejected' ? 'REJEITADA' : 'EM ANÁLISE';
       const statusColor = status === 'approved' ? '#059669' : status === 'rejected' ? '#dc2626' : '#d97706';
 
       await fetch('https://api.resend.com/emails', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${resendKey}`,
         },
         body: JSON.stringify({
           from: 'Elite Leilões <contato@premiumagro.com.br>',
           to: [email],
           subject: `Sua proposta foi ${statusLabel.toLowerCase()}!`,
           html: `
             <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
               <div style="background-color: #064e3b; padding: 30px; text-align: center;">
                 <h1 style="color: #fbbf24; margin: 0; font-size: 24px; letter-spacing: 2px;">ELITE LEILÕES</h1>
               </div>
               <div style="padding: 30px; color: #374151; line-height: 1.6;">
                 <h2 style="color: #064e3b;">Status da sua Proposta</h2>
                 <p>O status da sua proposta para <strong>${itemName}</strong> foi atualizado.</p>
                 <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                   <p style="margin: 0; font-size: 14px; color: #6b7280;">Novo Status:</p>
                   <p style="margin: 10px 0; font-weight: bold; font-size: 24px; color: ${statusColor}; text-transform: uppercase;">${statusLabel}</p>
                   <p style="margin: 0; font-size: 14px; color: #6b7280;">Valor: R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                 </div>
                 <div style="margin: 40px 0; text-align: center;">
                   <a href="https://agro-ncbrasil.lovable.app/painel" style="background-color: #fbbf24; color: #064e3b; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">VER MINHAS PROPOSTAS</a>
                 </div>
                 <p>Equipe Elite Leilões</p>
               </div>
             </div>
           `,
         }),
       });
     }
      } else {
        console.warn('RESEND_API_KEY not found. Email not sent.')
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
