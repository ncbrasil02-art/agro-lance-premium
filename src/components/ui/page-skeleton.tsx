import { Skeleton } from "./skeleton";
import { Loader2 } from "lucide-react";

export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64 md:h-12" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      <div className="mb-8 overflow-x-auto scrollbar-hide pb-2">
        <div className="flex gap-2 p-1">
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex justify-between gap-4 pt-4">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/20 backdrop-blur-[2px] pointer-events-none">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gold/20 blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 text-gold animate-spin relative z-10" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-gold animate-pulse">Carregando...</p>
        </div>
      </div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Skeleton */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="container relative mx-auto px-4">
          <div className="max-w-2xl space-y-6">
            <Skeleton className="h-7 w-48 rounded-full" />
            <Skeleton className="h-16 w-3/4 md:h-24" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <div className="flex flex-wrap gap-3 mt-8">
              <Skeleton className="h-12 w-40 rounded-xl" />
              <Skeleton className="h-12 w-48 rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 space-y-20">
        <div className="space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-video w-full rounded-2xl" />)}
          </div>
        </div>

        <div className="space-y-8">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="aspect-[9/16] w-full rounded-2xl" />)}
          </div>
        </div>
      </div>
    </div>
  );
}