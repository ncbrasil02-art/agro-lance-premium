import cattle from "@/assets/catalog/auction-cattle.webp.asset.json";
import horses from "@/assets/catalog/auction-horses.webp.asset.json";

export const catalogSlidePhotos = [cattle.url, horses.url];

// Only illustrative event covers change; real auction artwork remains untouched.
export function catalogEventCover(slug: string, original: string) {
  if (slug === "demonstracao-nelore-horizonte") return cattle.url;
  if (slug === "demonstracao-cavalos-nc") return horses.url;
  return original;
}