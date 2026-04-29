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
  
  // Clean up title and subtitle for SVG
  const cleanTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanSubtitle = subtitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700&amp;display=swap');
          .title { font-family: 'Inter', sans-serif; font-size: 72px; font-weight: 700; fill: white; }
          .brand { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; fill: #D4AF37; letter-spacing: 4px; }
          .subtitle { font-family: 'Inter', sans-serif; font-size: 28px; font-weight: 700; fill: #022C22; }
        </style>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(2,44,34,0.3);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(2,44,34,0.95);stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background Color -->
      <rect width="1200" height="630" fill="#022C22" />
      
      <!-- Background Image -->
      ${imageUrl ? `
        <image href="${imageUrl}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice" />
      ` : ''}
      
      <!-- Gradient Overlay -->
      <rect width="1200" height="630" fill="url(#grad1)" />

      <!-- Content -->
      <text x="80" y="100" class="brand">PREMIUM AGRO LEILÕES</text>
      
      <text x="80" y="380" class="title">
        ${cleanTitle.length > 35 ? cleanTitle.substring(0, 32) + '...' : cleanTitle}
      </text>
      
      ${cleanSubtitle ? `
        <rect x="80" y="415" width="${cleanSubtitle.length * 20 + 40}" height="50" rx="12" fill="#D4AF37" />
        <text x="100" y="450" class="subtitle">${cleanSubtitle.toUpperCase()}</text>
      ` : ''}
      
      <!-- Decorative element -->
      <rect x="80" y="120" width="100" height="4" fill="#D4AF37" />
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
