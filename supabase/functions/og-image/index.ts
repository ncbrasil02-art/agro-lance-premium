import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const title = url.searchParams.get('title') || 'Premium Agro Leilões'
  const subtitle = url.searchParams.get('subtitle') || ''
  const imageUrl = url.searchParams.get('imageUrl') || ''
  const type = url.searchParams.get('type') || 'website'

  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="1200" height="630" fill="#022C22" />
      
      ${imageUrl ? `
        <image href="${imageUrl}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice" opacity="0.6" />
      ` : ''}
      
      <!-- Gradient Overlay -->
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(2,44,34,0.4);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(2,44,34,0.9);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#grad1)" />

      <!-- Branding -->
      <text x="60" y="80" font-family="sans-serif" font-size="24" font-weight="bold" fill="#D4AF37" letter-spacing="2">PREMIUM AGRO LEILÕES</text>
      
      <!-- Title -->
      <text x="60" y="350" font-family="sans-serif" font-size="72" font-weight="bold" fill="white">
        ${title.length > 40 ? title.substring(0, 37) + '...' : title}
      </text>
      
      <!-- Subtitle/Category -->
      ${subtitle ? `
        <rect x="60" y="380" width="${subtitle.length * 15}" height="40" rx="10" fill="#D4AF37" />
        <text x="75" y="408" font-family="sans-serif" font-size="24" font-weight="bold" fill="#022C22">${subtitle.toUpperCase()}</text>
      ` : ''}
      
      <!-- Footer -->
      <rect x="0" y="620" width="1200" height="10" fill="#D4AF37" />
    </svg>
  `

  return new Response(svg, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
})
