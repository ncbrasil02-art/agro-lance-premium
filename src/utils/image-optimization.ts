/**
 * Preloads an array of images to the browser cache.
 */
export function preloadImages(urls: string[], options: OptimizationOptions = {}) {
  if (typeof window === "undefined") return;
  
  urls.forEach(url => {
    const optimizedUrl = getOptimizedImageUrl(url, options);
    const img = new Image();
    img.src = optimizedUrl;
  });
}

/**
 * Returns current cache statistics.
 */
export function getCacheStats() {
  return {
    hits: cacheHits,
    misses: cacheMisses,
    size: urlCache.size,
    hitRate: cacheHits + cacheMisses > 0 
      ? (cacheHits / (cacheHits + cacheMisses)) * 100 
      : 0
  };
}
const CACHE_KEY = "lovable_image_optimization_cache";
const MAX_CACHE_SIZE = 500;

const loadCache = (): Map<string, string> => {
  if (typeof window === "undefined") return new Map();
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return new Map(Object.entries(data));
    }
  } catch (e) {
    console.warn("Failed to load image cache from localStorage", e);
  }
  return new Map();
};

const saveCache = (cache: Map<string, string>) => {
  if (typeof window === "undefined") return;
  try {
    // If cache is too big, clear half of it (LRU would be better but this is simpler)
    if (cache.size > MAX_CACHE_SIZE) {
      const entries = Array.from(cache.entries());
      const newEntries = entries.slice(Math.floor(MAX_CACHE_SIZE / 2));
      cache = new Map(newEntries);
    }
    const data = Object.fromEntries(cache);
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to save image cache to localStorage", e);
  }
};

const urlCache = loadCache();
let cacheHits = 0;
let cacheMisses = 0;

export const IMAGE_FALLBACKS = {
  horse: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80",
  cattle: "https://images.unsplash.com/photo-1547499617-dc3f9b2df334?auto=format&fit=crop&q=80",
  event: "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  default: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"
};

interface OptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
}

/**
 * Optimizes a Supabase Storage URL using the built-in image transformation service.
 * Uses a local cache to avoid re-calculating the same transformation multiple times.
 */
export function getOptimizedImageUrl(
  originalUrl: string, 
  options: OptimizationOptions = {}, 
  fallbackSrc = IMAGE_FALLBACKS.default
): string {
  if (!originalUrl) return fallbackSrc;

   const { width, height, quality = 85, format = "webp" } = options;
  
  // Create a unique cache key based on URL and transformation parameters
  const cacheKey = `${originalUrl}|w:${width}|h:${height}|q:${quality}|f:${format}`;
  
  if (urlCache.has(cacheKey)) {
    cacheHits++;
    if (process.env.NODE_ENV === 'development' && cacheHits % 10 === 0) {
      console.log(`[ImageCache] Hits: ${cacheHits}, Misses: ${cacheMisses}, Rate: ${((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)}%`);
    }
    return urlCache.get(cacheKey)!;
  }

  cacheMisses++;

  // If it's not a Supabase public storage URL or already has params, return as is
  if (!originalUrl.includes("supabase.co/storage/v1/object/public/") || originalUrl.includes("?")) {
    return originalUrl;
  }

  try {
    // Transform: .../storage/v1/object/public/... -> .../storage/v1/render/image/public/...
    const optimizedBase = originalUrl.replace("/object/public/", "/render/image/public/");
    const params = new URLSearchParams();
    
    if (width) params.append("width", width.toString());
    if (height) params.append("height", height.toString());
    params.append("quality", quality.toString());
    params.append("format", format);

    const finalUrl = `${optimizedBase}?${params.toString()}`;
    urlCache.set(cacheKey, finalUrl);
    saveCache(urlCache);
    return finalUrl;
  } catch (e) {
    console.error("Error optimizing image URL:", e);
    return originalUrl;
  }
}