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
 
     const body = await req.json();
     console.log('Mercado Pago Webhook body:', body);
 
     // Notification types: payment, plan, subscription, etc.
     // We are interested in 'payment'
     if (body.type === 'payment' || body.topic === 'payment') {
       const paymentId = body.data?.id || body.id;
       
       if (!paymentId) {
         return new Response('No payment ID found', { status: 400 });
       }
 
       // 1. Fetch MP config from DB
       const { data: gateway } = await supabaseClient
         .from('payment_gateways')
         .select('config')
         .eq('name', 'mercado_pago')
         .single();
 
       const accessToken = gateway?.config?.access_token;
 
       if (!accessToken) {
         console.error('Mercado Pago Access Token not configured');
         return new Response('Gateway not configured', { status: 500 });
       }
 
       // 2. Get payment details from Mercado Pago
       const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
         headers: {
           'Authorization': `Bearer ${accessToken}`
         }
       });
 
       if (!mpResponse.ok) {
         const error = await mpResponse.text();
         console.error('Error fetching payment from MP:', error);
         return new Response('Error fetching payment', { status: 500 });
       }
 
       const paymentData = await mpResponse.json();
       console.log('MP Payment Status:', paymentData.status);
 
       // 3. Update DB based on payment status
       // We look for installments or transactions matching this external_reference
       const externalReference = paymentData.external_reference;
       
       if (externalReference) {
         // Check if it's an installment
         if (externalReference.startsWith('inst_')) {
           const installmentId = externalReference.replace('inst_', '');
           
           const status = paymentData.status === 'approved' ? 'paid' : 'pending';
           const paidAt = paymentData.status === 'approved' ? new Date().toISOString() : null;
 
           const { error: updateError } = await supabaseClient
             .from('installments')
             .update({ 
               status: status,
               paid_at: paidAt,
               gateway_status: paymentData.status,
               external_reference: paymentId.toString()
             })
             .eq('id', installmentId);
 
           if (updateError) console.error('Error updating installment:', updateError);
         } 
         // Or a general transaction
         else {
           const { error: updateError } = await supabaseClient
             .from('transactions')
             .update({ 
               payment_status: paymentData.status === 'approved' ? 'paid' : 'pending',
               gateway_status: paymentData.status,
               gateway_reference: paymentId.toString()
             })
             .eq('id', externalReference);
 
           if (updateError) console.error('Error updating transaction:', updateError);
         }
       } else {
         // If no external_reference, try matching by gateway_reference if we stored it before
         const { error: updateError } = await supabaseClient
           .from('installments')
           .update({ 
             status: paymentData.status === 'approved' ? 'paid' : 'pending',
             paid_at: paymentData.status === 'approved' ? new Date().toISOString() : null,
             gateway_status: paymentData.status
           })
           .eq('external_reference', paymentId.toString());
 
         if (updateError) console.error('Error updating installment by reference:', updateError);
       }
     }
 
     return new Response(JSON.stringify({ received: true }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       status: 200,
     })
   } catch (error) {
     console.error('Error handling webhook:', error)
     return new Response(JSON.stringify({ error: error.message }), {
       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       status: 400,
     })
   }
 })