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
      const eventId = body.id?.toString() || body.data?.id?.toString();
      if (!eventId) {
        return new Response('No ID found', { status: 400 });
      }

      // Idempotency check: Check if we already processed this event successfully
      const { data: existingEvent } = await supabaseClient
        .from('webhook_events')
        .select('id, status')
        .eq('gateway_name', 'mercado_pago')
        .eq('external_id', eventId)
        .maybeSingle();

      if (existingEvent && existingEvent.status === 'processed') {
        console.log(`Event ${eventId} already processed, skipping.`);
        return new Response(JSON.stringify({ received: true, already_processed: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      try {
        if (body.type === 'payment' || body.topic === 'payment') {
          const paymentId = body.data?.id || body.id;

          // 1. Fetch MP config from DB
          const { data: gateway } = await supabaseClient
            .from('payment_gateways')
            .select('config')
            .eq('name', 'mercado_pago')
            .single();

          const accessToken = gateway?.config?.access_token;

          if (!accessToken) throw new Error('Gateway not configured');

          // 2. Get payment details from Mercado Pago
          const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (!mpResponse.ok) throw new Error(`Error fetching payment from MP: ${await mpResponse.text()}`);

          const paymentData = await mpResponse.json();

          // 3. Update DB
          const externalReference = paymentData.external_reference;
          if (externalReference?.startsWith('inst_')) {
            const installmentId = externalReference.replace('inst_', '');
            await supabaseClient.from('installments').update({ 
              status: paymentData.status === 'approved' ? 'paid' : 'pending',
              paid_at: paymentData.status === 'approved' ? new Date().toISOString() : null,
              gateway_status: paymentData.status,
              external_reference: paymentId.toString()
            }).eq('id', installmentId);
          } else if (externalReference) {
            await supabaseClient.from('transactions').update({ 
              payment_status: paymentData.status === 'approved' ? 'paid' : 'pending',
              gateway_status: paymentData.status,
              gateway_reference: paymentId.toString()
            }).eq('id', externalReference);
          }
        }

        // Log as success
        await supabaseClient.from('webhook_events').upsert({
          gateway_name: 'mercado_pago',
          external_id: eventId,
          event_type: body.type || body.topic,
          payload: body,
          status: 'processed',
          error_message: null,
          processed_at: new Date().toISOString()
        }, { onConflict: 'gateway_name,external_id' });

       } catch (err: any) {
         console.error('Error processing webhook:', err);
         
         // Calculate next retry (exponential backoff: 5m, 15m, 1h, 4h, 12h)
         const retryDelays = [5, 15, 60, 240, 720];
         const currentRetry = existingEvent?.retry_count || 0;
         const nextDelay = retryDelays[Math.min(currentRetry, retryDelays.length - 1)];
         const nextRetryAt = new Date(Date.now() + nextDelay * 60000).toISOString();
 
         // Log as failure
         await supabaseClient.from('webhook_events').upsert({
           gateway_name: 'mercado_pago',
           external_id: eventId,
           event_type: body.type || body.topic,
           payload: body,
           status: 'failed',
           error_message: err.message,
           processed_at: new Date().toISOString(),
           next_retry_at: nextRetryAt,
           scheduled_for: nextRetryAt,
           retry_count: currentRetry
         }, { onConflict: 'gateway_name,external_id' });
         
         return new Response(JSON.stringify({ error: err.message }), { status: 400 });
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