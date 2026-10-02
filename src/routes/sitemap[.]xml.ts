import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://plataformaleiloesagro.site";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function buildXml(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/eventos", changefreq: "daily", priority: "0.9" },
          { path: "/lotes", changefreq: "daily", priority: "0.9" },
          { path: "/noticias", changefreq: "daily", priority: "0.8" },
          { path: "/ao-vivo", changefreq: "daily", priority: "0.8" },
          { path: "/compra-direta", changefreq: "weekly", priority: "0.8" },
          { path: "/sobre", changefreq: "monthly", priority: "0.6" },
          { path: "/cadastro", changefreq: "monthly", priority: "0.5" },
        ];

        try {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                // Opaque sb_ keys are not JWTs; send apikey without the default bearer.
                if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key)
                  headers.delete("Authorization");
                headers.set("apikey", key);
                return fetch(input, { ...init, headers });
              },
            },
          });

          const pageSize = 1000;

          // Public events
          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
              .from("events")
              .select("slug, updated_at")
              .neq("status", "cancelled")
              .not("slug", "is", null)
              .order("id")
              .range(offset, offset + pageSize - 1);
            if (error) {
              throw new Error(`Sitemap: erro ao buscar eventos: ${error.message}`);
            }
            entries.push(
              ...(data || []).map((event: { slug: string; updated_at: string | null }) => ({
                path: `/eventos/${encodeURIComponent(event.slug)}`,
                lastmod: event.updated_at ?? undefined,
                changefreq: "hourly" as const,
                priority: "0.9",
              }))
            );
            if (!data || data.length < pageSize) break;
          }

          // Published news posts
          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
              .from("posts")
              .select("slug, updated_at")
              .eq("status", "published")
              .order("id")
              .range(offset, offset + pageSize - 1);
            if (error) {
              throw new Error(`Sitemap: erro ao buscar notícias: ${error.message}`);
            }
            entries.push(
              ...(data || []).map((post: { slug: string; updated_at: string | null }) => ({
                path: `/noticias/${encodeURIComponent(post.slug)}`,
                lastmod: post.updated_at ?? undefined,
                changefreq: "weekly" as const,
                priority: "0.7",
              }))
            );
            if (!data || data.length < pageSize) break;
          }

          // Lots (public detail pages, UUID-based)
          for (let offset = 0; ; offset += pageSize) {
            const { data, error } = await supabase
              .from("lots")
              .select("id, updated_at")
              .order("id")
              .range(offset, offset + pageSize - 1);
            if (error) {
              throw new Error(`Sitemap: erro ao buscar lotes: ${error.message}`);
            }
            entries.push(
              ...(data || []).map((lot: { id: string; updated_at: string | null }) => ({
                path: `/lotes/${lot.id}`,
                lastmod: lot.updated_at ?? undefined,
                changefreq: "hourly" as const,
                priority: "0.6",
              }))
            );
            if (!data || data.length < pageSize) break;
          }
        } catch (err: any) {
          console.error("Sitemap: falha ao montar entradas dinâmicas:", err?.message);
          return new Response("Não foi possível gerar o sitemap completo.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }

        const xml = buildXml(entries);

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
