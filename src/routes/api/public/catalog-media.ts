import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { parseCatalogStorageUrl } from "@/utils/catalog-storage";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/catalog-media")({
  server: { handlers: { GET: async ({ request }) => {
    const source = new URL(request.url).searchParams.get("src") || "";
    const media = parseCatalogStorageUrl(source, import.meta.env.VITE_SUPABASE_URL);
    if (!media || source.length > 2048) return new Response("Imagem não encontrada", { status: 404 });
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return new Response("Imagens temporariamente indisponíveis", { status: 503 });
    const publicClient = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    // RLS as anon is the authority: private/unpublished rows never authorize media.
    let published = false;
    if (media.bucket === "banners") {
      const { data, error } = await publicClient.from("events").select("id").eq("banner_url", source).limit(1);
      if (error) return new Response("Imagens temporariamente indisponíveis", { status: 503 });
      published = Boolean(data?.length);
    } else if (media.bucket === "animals") {
      const { data, error } = await publicClient.from("animals").select("id").contains("photos", [source]).limit(1);
      if (error) return new Response("Imagens temporariamente indisponíveis", { status: 503 });
      published = Boolean(data?.length);
    } else {
      const [events, settings] = await Promise.all([
        publicClient.from("events").select("id").eq("promoter_logo_url", source).limit(1),
        publicClient.from("site_settings").select("key,value").in("key", ["homepage_sections", "site_info"]),
      ]);
      if (events.error || settings.error) return new Response("Imagens temporariamente indisponíveis", { status: 503 });
      published = Boolean(events.data?.length) || Boolean(settings.data?.some(row => {
        const value = row.value as { hero_backgrounds?: unknown; logo_url?: unknown } | null;
        return (row.key === "site_info" && value?.logo_url === source) ||
          (row.key === "homepage_sections" && Array.isArray(value?.hero_backgrounds) && value.hero_backgrounds.includes(source));
      }));
    }
    if (!published) return new Response("Imagem não encontrada", { status: 404 });
    // Privileged storage read only after the exact reference is publicly authorized.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.storage.from(media.bucket).download(media.path);
    if (error || !data) return new Response("Imagem não encontrada", { status: 404 });
    if (!["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"].includes(data.type)) return new Response("Formato não permitido", { status: 415 });
    return new Response(await data.arrayBuffer(), { headers: {
      "Content-Type": data.type, "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    } });
  } } },
});