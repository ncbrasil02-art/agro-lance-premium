import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function analyzeSEO(title: string, description: string, content?: string, image?: string, ogTitle?: string, ogDescription?: string) {
  const issues = [];
  
  if (!title) {
    issues.push({ level: 'error', message: 'Título SEO ausente.' });
  } else if (title.length < 30) {
    issues.push({ level: 'warn', message: 'Título curto demais.' });
  } else if (title.length > 60) {
    issues.push({ level: 'warn', message: 'Título longo demais.' });
  }

  if (!description) {
    issues.push({ level: 'error', message: 'Meta descrição ausente.' });
  } else if (description.length < 120) {
    issues.push({ level: 'warn', message: 'Descrição curta.' });
  }

  return issues;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: audit, error: auditError } = await supabase
      .from('seo_audits')
      .insert({ status: 'running' })
      .select().single()

    if (auditError) throw auditError;

    const [animals, posts, events] = await Promise.all([
      supabase.from("animals").select("id, name, seo_title, seo_description, photos"),
      supabase.from("posts").select("id, title, seo_title, seo_description, featured_image, content"),
      supabase.from("events").select("id, name, seo_title, seo_description, banner_url")
    ]);

    const auditDetails = [];
    let errorCount = 0;
    let warningCount = 0;
    let healthyCount = 0;

    const processItem = (item: any, type: string) => {
      const issues = analyzeSEO(item.seo_title || item.name || item.title, item.seo_description || "", "", item.photos?.[0] || item.featured_image || item.banner_url);
      if (issues.length === 0) healthyCount++;
      else if (issues.some(i => i.level === 'error')) errorCount++;
      else warningCount++;
      
      auditDetails.push({
        audit_id: audit.id,
        item_id: item.id,
        item_type: type,
        item_name: item.name || item.title,
        issues: issues
      });
    };

    animals.data?.forEach(a => processItem(a, 'animal'));
    posts.data?.forEach(p => processItem(p, 'post'));
    events.data?.forEach(e => processItem(e, 'event'));

    if (auditDetails.length > 0) {
      await supabase.from('seo_audit_details').insert(auditDetails);
    }

    await supabase.from('seo_audits').update({
      status: 'completed',
      total_items: auditDetails.length,
      error_count: errorCount,
      warning_count: warningCount,
      healthy_count: healthyCount
    }).eq('id', audit.id);

    // If there are errors, notify admins (hypothetical action)
    if (errorCount > 0) {
      console.log(`Auditoria concluída com ${errorCount} erros. Notificando administradores...`);
      // Here we could invoke the user-notifications function or similar
    }

    return new Response(JSON.stringify({ success: true, auditId: audit.id, stats: { errorCount, warningCount, healthyCount } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
