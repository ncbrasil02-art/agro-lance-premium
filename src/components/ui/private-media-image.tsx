import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parseCatalogStorageUrl } from "@/utils/catalog-storage";
import { OptimizedImage } from "./optimized-image";
import type { ComponentProps } from "react";

export function PrivateMediaImage(props: ComponentProps<typeof OptimizedImage>) {
  const [preview, setPreview] = useState<{ source: string; url: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const media = parseCatalogStorageUrl(props.src, import.meta.env.VITE_SUPABASE_URL);
    if (!media) return;
    // Storage validates the signed-in owner/administrator; no role is trusted here.
    supabase.storage.from(media.bucket).createSignedUrl(media.path, 3600).then(({ data }) => {
      if (!cancelled && data) setPreview({ source: props.src, url: data.signedUrl });
    });
    return () => { cancelled = true; };
  }, [props.src]);
  return <OptimizedImage {...props} src={preview?.source === props.src ? preview.url : props.src} />;
}