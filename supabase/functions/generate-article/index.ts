 import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
 
 const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders })
   }
 
   try {
     const { prompt } = await req.json()
 
     const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${LOVABLE_API_KEY}`,
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         model: 'google/gemini-2.0-flash-exp:free',
         messages: [
           {
             role: 'system',
             content: 'Você é um redator especializado no mercado agropecuário brasileiro. Gere um artigo de notícia para um portal de leilões. Retorne APENAS um objeto JSON com os campos: title, excerpt, content.'
           },
           {
             role: 'user',
             content: `Tema: ${prompt}`
           }
         ],
         response_format: { type: "json_object" }
       }),
     })
 
     const data = await response.json()
     const result = JSON.parse(data.choices[0].message.content)
 
     return new Response(
       JSON.stringify(result),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     )
   } catch (error) {
     return new Response(
       JSON.stringify({ error: error.message }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     )
   }
 })