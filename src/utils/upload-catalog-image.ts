import { supabase } from "@/integrations/supabase/client";
import { validateImage } from "./upload-validation";
import type { CATALOG_BUCKETS } from "./catalog-storage";

export async function uploadCatalogImage(file: File, bucket: typeof CATALOG_BUCKETS[number], folder: string) {
  if (!validateImage(file)) throw new Error("Selecione uma imagem válida.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file);
  if (error) throw error;
  // Persist a stable reference, never an expiring signed URL. The image renderer
  // resolves it through the published-record boundary or owner/admin storage RLS.
  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}