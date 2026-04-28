import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId, type, data } = await req.json()
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      throw new Error('User not found')
    }

    // Get user email from auth.users
    const { data: { user }, error: userError } = await supabaseClient.auth.admin.getUserById(userId)
    if (userError || !user) {
      throw new Error('User email not found')
    }

    const email = user.email

    if (type === 'user_approved') {
      console.log(`Sending approval email to ${email}`)
      
      // We'll use the Resend SDK if the key is available
      const resendKey = Deno.env.get('RESEND_API_KEY')
      
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
