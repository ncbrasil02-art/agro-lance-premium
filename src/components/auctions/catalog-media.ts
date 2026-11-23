import cattle from "@/assets/catalog/auction-cattle.webp.asset.json";
import horses from "@/assets/catalog/auction-horses.webp.asset.json";
import { parseCatalogStorageUrl } from "@/utils/catalog-storage";

export const catalogSlidePhotos = [cattle.url, horses.url];

// Only illustrative event covers change; real auction artwork remains untouched.
export function catalogEventCover(slug: string, original: string) {
  // An administrator's replacement takes precedence over illustrative defaults.
  if (parseCatalogStorageUrl(original, import.meta.env.VITE_SUPABASE_URL)) return original;
  if (slug === "demonstracao-nelore-horizonte") return cattle.url;
  if (slug === "demonstracao-cavalos-nc") return horses.url;
  return original;
}