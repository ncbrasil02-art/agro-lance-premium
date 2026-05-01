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
     console.log('PagBank Webhook body:', body);
 
     // PagBank V3 Webhook structure
     // We are interested in charges or orders
     const charge = body.charges?.[0] || body;
     const status = charge.status;
     const referenceId = body.reference_id; // This should be our installment ID
 
     if (referenceId && (status === 'PAID' || status === 'AUTHORIZED')) {
       // Check if it's an installment
       if (referenceId.startsWith('inst_')) {
         const installmentId = referenceId.replace('inst_', '');
         
         const { error: updateError } = await supabaseClient
           .from('installments')
           .update({ 
             status: 'paid',
             paid_at: new Date().toISOString(),
             gateway_status: status,
             external_reference: charge.id
           })
           .eq('id', installmentId);
 
         if (updateError) console.error('Error updating installment:', updateError);
       } else {
         // Generic transaction
         const { error: updateError } = await supabaseClient
           .from('transactions')
           .update({ 
             payment_status: 'paid',
             gateway_status: status,
             gateway_reference: charge.id
           })
           .eq('id', referenceId);
 
         if (updateError) console.error('Error updating transaction:', updateError);
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