interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  seoSettings?: any;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export function generateMetaTags({
  title,
  description,
  image,
  type = 'website',
  seoSettings,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
}: SEOProps) {
  const seoSuffix = seoSettings?.global_title_suffix || " | Premium Agro Leilões";
  const defaultDesc = seoSettings?.global_description || "A plataforma brasileira de leilões agropecuários com tecnologia de ponta.";
  const siteUrl = seoSettings?.site_url || "https://agro-ncbrasil.lovable.app";
  const supabaseUrl = "https://ccrslflbnxdazvadjlvj.supabase.co";

  const finalTitle = title ? `${title}${seoSuffix}` : "Premium Agro Leilões";
  const finalDesc = description || defaultDesc;
  
  // Logic for dynamic OG image
  let dynamicOgImage = "";
  if (title) {
    const params = new URLSearchParams();
    params.append('title', title);
    if (type) params.append('type', type);
    if (image) params.append('imageUrl', image);
    dynamicOgImage = `${supabaseUrl}/functions/v1/og-image?${params.toString()}`;
  }

  const finalImage = ogImage || dynamicOgImage || image || seoSettings?.og_default_image || "https://storage.googleapis.com/gpt-engineer-file-uploads/rqE5I25elIdK1C06SOEoftOdMw42/social-images/social-1777123688040-326248141_680976500478168_4709444458226195209_n.webp";

  const finalOgTitle = ogTitle || finalTitle;
  const finalOgDesc = ogDescription || finalDesc;
  const finalOgImage = ogImage || finalImage;

  const meta = [
    { title: finalTitle },
    { name: "description", content: finalDesc },
    
    // Open Graph
     { property: "og:title", content: finalOgTitle },
     { property: "og:description", content: finalOgDesc },
     { property: "og:image", content: finalOgImage },
    { property: "og:type", content: type },
    { property: "og:url", content: canonical ? `${siteUrl}${canonical}` : siteUrl },
    { property: "og:site_name", content: "Premium Agro Leilões" },
    { property: "og:locale", content: "pt_BR" },
    
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
     { name: "twitter:title", content: finalOgTitle },
     { name: "twitter:description", content: finalOgDesc },
     { name: "twitter:image", content: finalOgImage },
  ];

  if (seoSettings?.twitter_handle) {
    meta.push({ name: "twitter:site", content: seoSettings.twitter_handle });
    meta.push({ name: "twitter:creator", content: seoSettings.twitter_handle });
  }

  const links = [];
  if (canonical) {
    links.push({ rel: "canonical", href: `${siteUrl}${canonical}` });
  }

  return { meta, links };
}

  export function analyzeSEO(title: string, description: string, content?: string, image?: string, ogTitle?: string, ogDescription?: string) {
  const issues = [];
  
  // Title checks
  if (!title) {
    issues.push({ level: 'error', message: 'Título SEO ausente.' });
  } else if (title.length < 30) {
    issues.push({ level: 'warn', message: 'Título curto demais (mínimo 30 caracteres recomendados).' });
  } else if (title.length > 60) {
    issues.push({ level: 'warn', message: 'Título longo demais (máximo 60 caracteres recomendados para o Google).' });
  }

  // Description checks
  if (!description) {
    issues.push({ level: 'error', message: 'Meta descrição ausente.' });
  } else if (description.length < 120) {
    issues.push({ level: 'warn', message: 'Descrição curta (mínimo 120 caracteres recomendados).' });
  } else if (description.length > 160) {
    issues.push({ level: 'warn', message: 'Descrição longa demais (máximo 160 caracteres recomendados).' });
  }

   // Twitter Card checks
   if (!image) {
     issues.push({ level: 'warn', message: 'Imagem para Twitter Card ausente (recomendado para melhor engajamento).' });
   }
 
  // Open Graph checks
  if (!ogTitle && title) {
    issues.push({ level: 'info', message: 'Usando título padrão para Open Graph. Considere um título específico para redes sociais.' });
  }

  if (!ogDescription && description) {
    issues.push({ level: 'info', message: 'Usando descrição padrão para Open Graph. Considere uma descrição otimizada para redes sociais.' });
  }

   // Content keywords (basic check)
   if (content && title) {
     const mainKeywords = title.toLowerCase().split(' ').filter(w => w.length > 4);
     const foundKeywords = mainKeywords.filter(k => content.toLowerCase().includes(k));
     if (foundKeywords.length === 0 && mainKeywords.length > 0) {
       issues.push({ level: 'info', message: 'Considere usar palavras-chave do título no conteúdo do texto.' });
     }
   }
 
   return issues;
 }
