import { useState, useEffect, useMemo } from "react";
import { getOptimizedImageUrl, IMAGE_FALLBACKS } from "@/utils/image-optimization";
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
  category?: keyof typeof IMAGE_FALLBACKS;
  priority?: "high" | "medium" | "low";
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  aspectRatio = "auto",
  quality,
  loading,
  fallbackSrc,
  category = "default",
  priority = "medium",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const finalFallback = useMemo(() => {
    return fallbackSrc || IMAGE_FALLBACKS[category] || IMAGE_FALLBACKS.default;
  }, [fallbackSrc, category]);

  const finalQuality = useMemo(() => {
    if (quality) return quality;
    switch (priority) {
      case "high": return 90;
      case "low": return 60;
      default: return 80;
    }
  }, [quality, priority]);

  const finalLoading = useMemo(() => {
    if (loading) return loading;
    return priority === "high" ? "eager" : "lazy";
  }, [loading, priority]);

  const optimizedUrl = useMemo(() => {
    return getOptimizedImageUrl(src, { width, height, quality: finalQuality }, finalFallback);
  }, [src, width, height, finalQuality, finalFallback]);

  const [currentSrc, setCurrentSrc] = useState(optimizedUrl);

  useEffect(() => {
    setCurrentSrc(optimizedUrl);
    setIsLoading(true);
    setError(false);
  }, [optimizedUrl]);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setError(true);
    setCurrentSrc(finalFallback);
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
        loading={finalLoading}
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