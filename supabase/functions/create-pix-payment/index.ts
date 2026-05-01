 import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders })
   }
 
   try {
     const supabaseClient = createClient(
       Deno.env.get('SUPABASE_URL') ?? '',
       Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
     )
 
     const { installmentId, gatewayName } = await req.json()
 
     // 1. Fetch installment details
     const { data: inst, error: instError } = await supabaseClient
       .from('installments')
       .select(`*, buyer:profiles!buyer_id(email, full_name)`)
       .eq('id', installmentId)
       .single()
 
     if (instError || !inst) {
       return new Response(JSON.stringify({ error: 'Installment not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
     }
 
     // 2. Fetch gateway config
     const { data: gateway } = await supabaseClient
       .from('payment_gateways')
       .select('config')
       .eq('name', gatewayName)
       .single()
 
     if (!gateway?.config?.access_token && gatewayName === 'mercado_pago') {
       return new Response(JSON.stringify({ error: 'Gateway not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
     }
 
     if (gatewayName === 'mercado_pago') {
       const accessToken = gateway.config.access_token
       
       const mpBody = {
         transaction_amount: Number(inst.amount),
         description: `Parcela ${inst.installment_number} - Elite Leilões`,
         payment_method_id: 'pix',
         external_reference: `inst_${inst.id}`,
         payer: {
           email: inst.buyer.email,
           first_name: inst.buyer.full_name.split(' ')[0],
           last_name: inst.buyer.full_name.split(' ').slice(1).join(' ') || 'User'
         },
         notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercado-pago-webhook`
       }
 
       const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${accessToken}`,
           'Content-Type': 'application/json',
           'X-Idempotency-Key': inst.id // Use installment ID as idempotency key
         },
         body: JSON.stringify(mpBody)
       })
 
       const paymentData = await mpResponse.json()
 
       if (!mpResponse.ok) {
         console.error('MP Error:', paymentData)
         return new Response(JSON.stringify({ error: paymentData.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
       }
 
       // Store the external ID
       await supabaseClient
         .from('installments')
         .update({ 
           external_reference: paymentData.id.toString(),
           gateway_status: paymentData.status
         })
         .eq('id', inst.id)
 
       return new Response(JSON.stringify({
         qr_code: paymentData.point_of_interaction.transaction_data.qr_code,
         qr_code_base64: paymentData.point_of_interaction.transaction_data.qr_code_base64,
         status: paymentData.status
       }), {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       })
     }
 
     return new Response(JSON.stringify({ error: 'Unsupported gateway' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
 
   } catch (error) {
     console.error('Error:', error)
     return new Response(JSON.stringify({ error: error.message }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       status: 400,
     })
   }
 })