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

    const summary = {
      webhooks: { processed: 0, succeeded: 0, failed: 0 },
      notifications: { processed: 0, succeeded: 0, failed: 0 },
      installments: { processed: 0, reconciled: 0 }
    }

    // --- RECONCILE WEBHOOKS ---
    const { data: failedWebhooks } = await supabaseClient
      .from('webhook_events')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', 10)
      .limit(20)

    for (const event of failedWebhooks || []) {
      summary.webhooks.processed++
      try {
        const functionName = event.gateway_name === 'mercado_pago' ? 'mercado-pago-webhook' : 'pagbank-webhook'
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/${functionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
          },
          body: JSON.stringify(event.payload)
        })

        if (response.ok) {
          summary.webhooks.succeeded++
        } else {
          summary.webhooks.failed++
          await supabaseClient
            .from('webhook_events')
            .update({ retry_count: (event.retry_count || 0) + 1 })
            .eq('id', event.id)
        }
      } catch (err) {
        summary.webhooks.failed++
      }
    }

    // --- RECONCILE NOTIFICATIONS ---
    const { data: failedNotifications } = await supabaseClient
      .from('notification_logs')
      .select('*')
      .eq('status', 'failed')
      .limit(20)

    for (const log of failedNotifications || []) {
      summary.notifications.processed++
      try {
        const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/user-notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            userId: log.user_id,
            type: log.type,
            title: log.title,
            message: log.message,
            userEmail: log.recipient_email
          })
        })

        if (response.ok) {
          summary.notifications.succeeded++
          await supabaseClient.from('notification_logs').update({ status: 'sent', error_details: 'Reconciled' }).eq('id', log.id)
        } else {
          summary.notifications.failed++
        }
      } catch (err) {
        summary.notifications.failed++
      }
    }

    // --- RECONCILE PAYMENTS ---
    const reconcilePaymentsRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/reconcile-payments`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (reconcilePaymentsRes.ok) {
      const pData = await reconcilePaymentsRes.json()
      summary.installments.processed = pData.total || 0
      summary.installments.reconciled = pData.updated || 0
    }

    return new Response(JSON.stringify(summary), {
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
