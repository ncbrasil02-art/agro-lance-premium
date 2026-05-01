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
 
     // 1. Authenticate the caller (Admin only)
     const authHeader = req.headers.get('Authorization')
     if (!authHeader) {
       return new Response('Unauthorized', { status: 401 })
     }
 
     const token = authHeader.replace('Bearer ', '')
     const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
 
     if (authError || !user) {
       return new Response('Unauthorized', { status: 401 })
     }
 
     // Check if user is admin
     const { data: profile } = await supabaseClient
       .from('profiles')
       .select('role')
       .eq('id', user.id)
       .single()
 
     if (profile?.role !== 'admin') {
       return new Response('Forbidden', { status: 403 })
     }
 
     // 2. Fetch pending installments with external references
     const { data: installments, error: instError } = await supabaseClient
       .from('installments')
       .select('*')
       .eq('status', 'pending')
       .not('external_reference', 'is', null)
 
     if (instError) throw instError
 
     const results = {
       total: installments?.length || 0,
       updated: 0,
       errors: []
     }
 
     // 3. Fetch gateway configs
     const { data: gateways } = await supabaseClient
       .from('payment_gateways')
       .select('*')
 
     const mpConfig = gateways?.find(g => g.name === 'mercado_pago')?.config
     const pagbankConfig = gateways?.find(g => g.name === 'pagbank')?.config
 
     // 4. Process each installment
     for (const inst of installments || []) {
       try {
         // Mercado Pago logic
         if (mpConfig?.access_token && inst.external_reference?.match(/^\d+$/)) {
           const response = await fetch(`https://api.mercadopago.com/v1/payments/${inst.external_reference}`, {
             headers: { 'Authorization': `Bearer ${mpConfig.access_token}` }
           })
 
           if (response.ok) {
             const paymentData = await response.json()
             if (paymentData.status === 'approved') {
               await supabaseClient
                 .from('installments')
                 .update({ 
                   status: 'paid', 
                   paid_at: new Date().toISOString(),
                   gateway_status: paymentData.status 
                 })
                 .eq('id', inst.id)
               results.updated++
             }
           }
         }
         
         // PagBank logic (if needed, simplified here)
         // ...
       } catch (err) {
         console.error(`Error reconciling installment ${inst.id}:`, err)
         results.errors.push({ id: inst.id, error: err.message })
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