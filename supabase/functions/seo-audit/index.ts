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
    issues.push({ level: 'warn', message: 'Título curto demais (mínimo 30 caracteres).' });
  } else if (title.length > 60) {
    issues.push({ level: 'warn', message: 'Título longo demais (máximo 60 caracteres).' });
  }

  if (!description) {
    issues.push({ level: 'error', message: 'Meta descrição ausente.' });
  } else if (description.length < 120) {
    issues.push({ level: 'warn', message: 'Descrição curta (mínimo 120 caracteres).' });
  } else if (description.length > 160) {
    issues.push({ level: 'warn', message: 'Descrição longa demais (máximo 160 caracteres).' });
  }

  if (!image) {
    issues.push({ level: 'warn', message: 'Imagem para Twitter Card ausente.' });
  }

  if (!ogTitle && title) {
    issues.push({ level: 'info', message: 'Usando título padrão para Open Graph.' });
  }

  if (!ogDescription && description) {
    issues.push({ level: 'info', message: 'Usando descrição padrão para Open Graph.' });
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

    // Create audit record
    const { data: audit, error: auditError } = await supabase
      .from('seo_audits')
      .insert({ status: 'running' })
      .select()
      .single()

    if (auditError) throw auditError;

    // Fetch data
    const [animals, posts, events] = await Promise.all([
      supabase.from("animals").select("id, name, seo_title, seo_description, photos, og_title, og_description"),
      supabase.from("posts").select("id, title, seo_title, seo_description, featured_image, og_title, og_description, content"),
      supabase.from("events").select("id, name, seo_title, seo_description, banner_url, og_title, og_description")
    ]);

    const auditDetails = [];
    let errorCount = 0;
    let warningCount = 0;
    let healthyCount = 0;

    // Analyze Animals
    animals.data?.forEach(a => {
      const issues = analyzeSEO(a.seo_title || a.name, a.seo_description || "", "", a.photos?.[0], a.og_title, a.og_description);
      if (issues.length === 0) healthyCount++;
      else if (issues.some(i => i.level === 'error')) errorCount++;
      else warningCount++;
      
      auditDetails.push({
        audit_id: audit.id,
        item_id: a.id,
        item_type: 'animal',
        item_name: a.name,
        issues: issues
      });
    });

    // Analyze Posts
    posts.data?.forEach(p => {
      const issues = analyzeSEO(p.seo_title || p.title, p.seo_description || "", p.content || "", p.featured_image, p.og_title, p.og_description);
      if (issues.length === 0) healthyCount++;
      else if (issues.some(i => i.level === 'error')) errorCount++;
      else warningCount++;

      auditDetails.push({
        audit_id: audit.id,
        item_id: p.id,
        item_type: 'post',
        item_name: p.title,
        issues: issues
      });
    });

    // Analyze Events
    events.data?.forEach(e => {
      const issues = analyzeSEO(e.seo_title || e.name, e.seo_description || "", "", e.banner_url, e.og_title, e.og_description);
      if (issues.length === 0) healthyCount++;
      else if (issues.some(i => i.level === 'error')) errorCount++;
      else warningCount++;

      auditDetails.push({
        audit_id: audit.id,
        item_id: e.id,
        item_type: 'event',
        item_name: e.name,
        issues: issues
      });
    });

    // Insert details in batches
    if (auditDetails.length > 0) {
      await supabase.from('seo_audit_details').insert(auditDetails);
    }

    // Finalize audit record
    await supabase.from('seo_audits').update({
      status: 'completed',
      total_items: auditDetails.length,
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
