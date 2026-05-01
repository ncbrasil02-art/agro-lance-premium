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
 
     // 1. Authenticate (Admin only)
     const authHeader = req.headers.get('Authorization')
     if (!authHeader) return new Response('Unauthorized', { status: 401 })
 
     const token = authHeader.replace('Bearer ', '')
     const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
     if (authError || !user) return new Response('Unauthorized', { status: 401 })
 
     const { data: profile } = await supabaseClient.from('profiles').select('role').eq('id', user.id).single()
     if (profile?.role !== 'admin') return new Response('Forbidden', { status: 403 })
 
     // 2. Fetch failed events that are scheduled for retry now or in the past
     const { data: failedEvents, error: fetchError } = await supabaseClient
       .from('webhook_events')
       .select('*')
       .eq('status', 'failed')
       .lt('retry_count', 5)
       .lte('scheduled_for', new Date().toISOString())
       .order('scheduled_for', { ascending: true })
       .limit(20)
 
     if (fetchError) throw fetchError
 
     const results = {
       processed: 0,
       succeeded: 0,
       failed: 0,
       details: []
     }
 
     for (const event of failedEvents || []) {
       results.processed++
       try {
         const functionName = event.gateway_name === 'mercado_pago' ? 'mercado-pago-webhook' : 'pagbank-webhook'
         
         // Re-invoke the webhook function
         const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
           },
           body: JSON.stringify(event.payload)
         })
 
         if (response.ok) {
           results.succeeded++
           results.details.push({ id: event.id, status: 'success' })
         } else {
           results.failed++
           results.details.push({ id: event.id, status: 'failed', error: await response.text() })
           
           // Increment retry count in DB
           await supabaseClient
             .from('webhook_events')
             .update({ 
               retry_count: (event.retry_count || 0) + 1,
               processed_at: new Date().toISOString()
             })
             .eq('id', event.id)
         }
       } catch (err) {
         results.failed++
         results.details.push({ id: event.id, status: 'error', error: err.message })
       }
     }
 
     return new Response(JSON.stringify(results), {
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