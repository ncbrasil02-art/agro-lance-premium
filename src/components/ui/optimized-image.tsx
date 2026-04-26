import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  aspectRatio?: "square" | "video" | "portrait" | "landscape" | "auto" | "9/16";
  quality?: number;
  loading?: "lazy" | "eager";
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  aspectRatio = "auto",
  quality = 80,
  loading = "lazy",
  fallbackSrc = "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Function to optimize Supabase Storage URLs
  const getOptimizedUrl = (originalUrl: string) => {
    if (!originalUrl) return fallbackSrc;
    
    // If it's already a transformed URL or not from Supabase, return as is
    if (!originalUrl.includes("supabase.co/storage/v1/object/public/") || originalUrl.includes("?")) {
      return originalUrl;
    }

    try {
      // Transform standard public URL to render URL for optimization
      // From: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      // To: https://[project].supabase.co/storage/v1/render/image/public/[bucket]/[path]?width=[w]&quality=[q]
      const optimizedUrl = originalUrl.replace("/object/public/", "/render/image/public/");
      const params = new URLSearchParams();
      
      if (width) params.append("width", width.toString());
      if (height) params.append("height", height.toString());
      params.append("quality", quality.toString());
      params.append("format", "webp"); // Force webp for better compression

      return `${optimizedUrl}?${params.toString()}`;
    } catch (e) {
      return originalUrl;
    }
  };

  useEffect(() => {
    setCurrentSrc(getOptimizedUrl(src));
    setIsLoading(true);
    setError(false);
  }, [src, width, height, quality]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
    setCurrentSrc(fallbackSrc);
  };

  const aspectRatios = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    "9/16": "aspect-[9/16]",
    auto: "",
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden bg-muted", 
        aspectRatios[aspectRatio as keyof typeof aspectRatios],
        className
      )}
    >
      {isLoading && (
        <Skeleton className="absolute inset-0 z-10 h-full w-full" />
      )}
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "h-full w-full object-cover transition-all duration-500",
          isLoading ? "scale-105 blur-lg" : "scale-100 blur-0",
          className
        )}
        {...props}
      />
    </div>
  );
}