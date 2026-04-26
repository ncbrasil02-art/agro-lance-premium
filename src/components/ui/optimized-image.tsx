import { useState, useEffect, useMemo } from "react";
import { getOptimizedImageUrl } from "@/utils/image-optimization";
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
  const optimizedUrl = useMemo(() => {
    return getOptimizedImageUrl(src, { width, height, quality }, fallbackSrc);
  }, [src, width, height, quality, fallbackSrc]);

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