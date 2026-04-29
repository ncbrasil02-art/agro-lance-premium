interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  seoSettings?: any;
  canonical?: string;
}

export function generateMetaTags({
  title,
  description,
  image,
  type = 'website',
  seoSettings,
  canonical,
}: SEOProps) {
  const seoSuffix = seoSettings?.global_title_suffix || " | Premium Agro Leilões";
  const defaultDesc = seoSettings?.global_description || "A plataforma brasileira de leilões agropecuários com tecnologia de ponta.";
  const siteUrl = seoSettings?.site_url || "https://agro-ncbrasil.lovable.app";

  const finalTitle = title ? `${title}${seoSuffix}` : "Premium Agro Leilões";
  const finalDesc = description || defaultDesc;
  const finalImage = image || "https://storage.googleapis.com/gpt-engineer-file-uploads/rqE5I25elIdK1C06SOEoftOdMw42/social-images/social-1777123688040-326248141_680976500478168_4709444458226195209_n.webp";

  const meta = [
    { title: finalTitle },
    { name: "description", content: finalDesc },
    
    // Open Graph
    { property: "og:title", content: finalTitle },
    { property: "og:description", content: finalDesc },
    { property: "og:image", content: finalImage },
    { property: "og:type", content: type },
    { property: "og:url", content: canonical ? `${siteUrl}${canonical}` : siteUrl },
    { property: "og:site_name", content: "Premium Agro Leilões" },
    { property: "og:locale", content: "pt_BR" },
    
    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: finalTitle },
    { name: "twitter:description", content: finalDesc },
    { name: "twitter:image", content: finalImage },
  ];

  const links = [];
  if (canonical) {
    links.push({ rel: "canonical", href: `${siteUrl}${canonical}` });
  }

  return { meta, links };
}

export function analyzeSEO(title: string, description: string, content?: string) {
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
