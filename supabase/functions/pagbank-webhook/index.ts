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
      // Security: Fetch the gateway configuration to verify if we should validate signatures
      // In a real scenario, we would check X-PagSeguro-Token or similar
      const { data: gateway } = await supabaseClient
        .from('payment_gateways')
        .select('config, webhook_secret')
        .eq('name', 'pagbank')
        .single();

      const charge = body.charges?.[0] || body;
      const status = charge.status;
      const referenceId = body.reference_id;
      const eventId = body.id || charge.id;

      if (!eventId) {
        return new Response('No ID found', { status: 400 });
      }

      // Idempotency check
      const { data: existingEvent } = await supabaseClient
        .from('webhook_events')
        .select('id, status')
        .eq('gateway_name', 'pagbank')
        .eq('external_id', eventId)
        .maybeSingle();

      if (existingEvent && existingEvent.status === 'processed') {
        console.log(`Event ${eventId} already processed, skipping.`);
        return new Response(JSON.stringify({ received: true, already_processed: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        })
      }

      // If we have a secret configured, we should validate it.
      // For now, we fetch back if possible or just use the referenceId carefully.

      try {
        if (referenceId && (status === 'PAID' || status === 'AUTHORIZED')) {
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
            if (updateError) throw updateError;
          } else {
            const { error: updateError } = await supabaseClient
              .from('transactions')
              .update({ 
                payment_status: 'paid',
                gateway_status: status,
                gateway_reference: charge.id
              })
              .eq('id', referenceId);
            if (updateError) throw updateError;
          }
        }

        // Log as success
        await supabaseClient.from('webhook_events').upsert({
          gateway_name: 'pagbank',
          external_id: eventId,
          event_type: status,
          payload: body,
          status: 'processed',
          error_message: null,
          processed_at: new Date().toISOString()
        }, { onConflict: 'gateway_name,external_id' });

      } catch (err: any) {
        console.error('Error processing PagBank webhook:', err);
        // Log as failure
        await supabaseClient.from('webhook_events').upsert({
          gateway_name: 'pagbank',
          external_id: eventId,
          event_type: status,
          payload: body,
          status: 'failed',
          error_message: err.message,
          processed_at: new Date().toISOString()
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