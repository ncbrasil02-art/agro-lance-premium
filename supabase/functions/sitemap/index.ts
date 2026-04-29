import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type'); // 'news' or null

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: siteSettings } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'site_info')
      .single();

    const siteUrl = siteSettings?.value?.site_url || 'https://agro-ncbrasil.lovable.app';
    const siteName = siteSettings?.value?.name || 'Premium Agro Leilões';

    if (type === 'news') {
      // Google News Sitemap (last 2 days)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const { data: newsPosts } = await supabase
        .from('posts')
        .select('title, slug, published_at')
        .eq('status', 'published')
        .gte('published_at', twoDaysAgo.toISOString())
        .order('published_at', { ascending: false });

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n';

      newsPosts?.forEach(post => {
        xml += '  <url>\n';
        xml += `    <loc>${siteUrl}/noticias/${post.slug}</loc>\n`;
        xml += '    <news:news>\n';
        xml += '      <news:publication>\n';
        xml += `        <news:name>${siteName}</news:publication_name>\n`;
        xml += '        <news:language>pt-br</news:language>\n';
        xml += '      </news:publication>\n';
        xml += `      <news:publication_date>${new Date(post.published_at).toISOString()}</news:publication_date>\n`;
        xml += `      <news:title>${post.title}</news:title>\n`;
        xml += '    </news:news>\n';
        xml += '  </url>\n';
      });

      xml += '</urlset>';
      
      return new Response(xml, {
        headers: { ...corsHeaders, 'Content-Type': 'application/xml' }
      });
    }

    // Default Sitemap
    const [eventsRes, postsRes] = await Promise.all([
      supabase.from('events').select('slug, updated_at').order('updated_at', { ascending: false }),
      supabase.from('posts').select('slug, updated_at').eq('status', 'published').order('updated_at', { ascending: false })
    ]);

    const staticPages = ['', '/sobre', '/eventos', '/noticias', '/compra-direta', '/cadastro'];

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    staticPages.forEach(page => {
      sitemap += `  <url>\n    <loc>${siteUrl}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    eventsRes.data?.forEach(event => {
      sitemap += `  <url>\n    <loc>${siteUrl}/eventos/${event.slug}</loc>\n    <lastmod>${new Date(event.updated_at).toISOString().split('T')[0]}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    });

    postsRes.data?.forEach(post => {
      sitemap += `  <url>\n    <loc>${siteUrl}/noticias/${post.slug}</loc>\n    <lastmod>${new Date(post.updated_at).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    sitemap += '</urlset>';

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
