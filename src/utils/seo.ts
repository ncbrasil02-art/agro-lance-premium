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
    { property: "og:title", content: finalTitle },
    { property: "og:description", content: finalDesc },
    { property: "og:image", content: finalImage },
    { property: "og:type", content: type },
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
