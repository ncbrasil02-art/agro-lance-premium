import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function analyzeSEO(title: string, description: string, content?: string, image?: string) {
  const issues = [];
  if (!title) issues.push({ level: 'error', message: 'Título SEO ausente.' });
  else if (title.length < 30) issues.push({ level: 'warn', message: 'Título curto.' });
  if (!description) issues.push({ level: 'error', message: 'Meta descrição ausente.' });
  else if (description.length < 120) issues.push({ level: 'warn', message: 'Descrição curta.' });
  return issues;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: audit, error: auditError } = await supabase
      .from('seo_audits')
      .insert({ status: 'running', progress_message: 'Iniciando coleta de dados...' })
      .select().single()

    if (auditError) throw auditError;

    const [animals, posts, events] = await Promise.all([
      supabase.from("animals").select("id, name, seo_title, seo_description, photos"),
      supabase.from("posts").select("id, title, seo_title, seo_description, featured_image, content"),
      supabase.from("events").select("id, name, seo_title, seo_description, banner_url")
    ]);

    const allItems = [
      ...(animals.data || []).map(i => ({ ...i, type: 'animal' })),
      ...(posts.data || []).map(i => ({ ...i, type: 'post', name: i.title })),
      ...(events.data || []).map(i => ({ ...i, type: 'event' }))
    ];

    await supabase.from('seo_audits').update({ 
      total_items: allItems.length,
      status: 'processing',
      progress_message: `Analisando ${allItems.length} itens...`
    }).eq('id', audit.id);

    let errorCount = 0;
    let warningCount = 0;
    let healthyCount = 0;
    let processed = 0;

    for (const item of allItems) {
      const issues = analyzeSEO(item.seo_title || item.name, item.seo_description || "", "", item.photos?.[0] || item.featured_image || item.banner_url);
      
      if (issues.length === 0) healthyCount++;
      else if (issues.some(i => i.level === 'error')) errorCount++;
      else warningCount++;

      await supabase.from('seo_audit_details').insert({
        audit_id: audit.id,
        item_id: item.id,
        item_type: item.type,
        item_name: item.name,
        issues: issues
      });

      processed++;
      
      // Update progress every 5 items to avoid too many DB calls but show progress
      if (processed % 5 === 0 || processed === allItems.length) {
        await supabase.from('seo_audits').update({ 
          processed_items: processed,
          progress_message: `Processado ${processed} de ${allItems.length} itens...`
        }).eq('id', audit.id);
      }
    }

    await supabase.from('seo_audits').update({
      status: 'completed',
      progress_message: 'Auditoria finalizada com sucesso.',
      error_count: errorCount,
      warning_count: warningCount,
      healthy_count: healthyCount
    }).eq('id', audit.id);

    return new Response(JSON.stringify({ success: true, auditId: audit.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
