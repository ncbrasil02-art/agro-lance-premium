import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, content, title } = await req.json()
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    const prompt = `Você é um especialista em SEO para o agronegócio premium.
    Gere metatags otimizadas para um(a) ${type} com base nos dados abaixo:
    Título: ${title}
    Conteúdo/Descrição: ${content}

    Retorne APENAS um JSON no formato:
    {
      "seo_title": "Título entre 50-60 caracteres",
      "seo_description": "Descrição entre 140-160 caracteres com call to action",
      "og_title": "Título atraente para redes sociais",
      "og_description": "Descrição envolvente para redes sociais"
    }`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em SEO técnico e copywriting para o agronegócio.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    })

    const result = await response.json()
    const aiResponse = JSON.parse(result.choices[0].message.content)

    return new Response(JSON.stringify(aiResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
