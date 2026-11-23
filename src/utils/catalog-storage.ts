export const CATALOG_BUCKETS = ["banners", "animals", "public-assets"] as const;
export function parseCatalogStorageUrl(source: string, origin: string) {
  try {
    const url = new URL(source);
    if (url.origin !== new URL(origin).origin || url.search) return null;
    const match = url.pathname.match(/^\/storage\/v1\/object\/public\/(banners|animals|public-assets)\/(.+)$/);
    if (!match?.[1] || !match[2]) return null;
    const path = decodeURIComponent(match[2]);
    if (path.split("/").some(part => !part || part === "." || part === "..") || /[\\\x00-\x1f]/.test(path)) return null;
    return { bucket: match[1], path };
  } catch { return null; }
}
export function catalogMediaUrl(source: string) {
  if (!parseCatalogStorageUrl(source, import.meta.env.VITE_SUPABASE_URL)) return source;
  return `/api/public/catalog-media?src=${encodeURIComponent(source)}`;
}