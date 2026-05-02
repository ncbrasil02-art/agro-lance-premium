 export function SectionSkeleton({ type = "cards", count = 3 }: { type?: "cards" | "lots" | "articles", count?: number }) {
   return (
     <section className="container mx-auto px-4 py-16 animate-pulse">
       <div className="mb-8 space-y-4">
         <Skeleton className="h-10 w-64 md:h-12 rounded-xl" />
         <Skeleton className="h-5 w-96 max-w-full rounded-lg" />
       </div>
       <div className={`grid gap-6 ${
         type === "lots" 
           ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
           : type === "articles"
             ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
             : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
       }`}>
         {Array.from({ length: count }).map((_, i) => (
           <div key={i} className="space-y-4">
             <Skeleton className={`${type === "lots" ? "aspect-[3/4]" : "aspect-video"} w-full rounded-3xl`} />
             <div className="space-y-2 px-2">
               <Skeleton className="h-6 w-3/4 rounded-lg" />
               <Skeleton className="h-4 w-1/2 rounded-lg" />
             </div>
           </div>
         ))}
       </div>
     </section>
   );
 }
 
export function LotDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500">
      <div className="border-b border-gold/20 bg-emerald-deep py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-10 w-16" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Skeleton className="aspect-square w-full rounded-[2.5rem]" />
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-20 rounded-xl" />)}
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-muted/30 border border-white/5 space-y-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-48" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </div>
            </div>

            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import { Skeleton } from "./skeleton";
import { Loader2, Calendar, MapPin, Gavel, Trophy } from "lucide-react";
export function EventDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20 animate-in fade-in duration-500">
      <div className="relative h-[40vh] md:h-[50vh] overflow-hidden bg-muted">
        <Skeleton className="h-full w-full" />
      </div>

      <section className="relative -mt-40 md:-mt-60 z-10 pb-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.8fr] items-start">
            <div className="mx-auto w-full max-w-md lg:max-w-none">
              <Skeleton className="aspect-[3/4] md:aspect-square lg:aspect-[4/5] w-full rounded-[2rem] md:rounded-[3rem]" />
            </div>

            <div className="flex flex-col lg:pt-12 space-y-8">
              <div className="flex gap-4">
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-8 w-48 rounded-full" />
              </div>
              
              <Skeleton className="h-20 w-full md:h-32" />
              
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-2/3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24 rounded-[2rem]" />
                ))}
              </div>

              <div className="flex gap-4">
                <Skeleton className="h-20 flex-1 rounded-[1.5rem]" />
                <Skeleton className="h-20 w-48 rounded-[1.5rem]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

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

 export function NewsPageSkeleton() {
   return (
     <div className="container mx-auto px-4 py-20 animate-in fade-in duration-500">
       <div className="space-y-4 mb-12">
         <Skeleton className="h-12 w-64" />
         <Skeleton className="h-6 w-full max-w-2xl" />
       </div>
       <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
         {[1, 2, 3, 4, 5, 6].map((i) => (
           <div key={i} className="space-y-4 border rounded-2xl p-0 overflow-hidden">
             <Skeleton className="aspect-video w-full" />
             <div className="p-6 space-y-4">
               <div className="flex justify-between">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-4 w-20" />
               </div>
               <Skeleton className="h-8 w-full" />
               <Skeleton className="h-20 w-full" />
               <Skeleton className="h-6 w-24" />
             </div>
           </div>
         ))}
       </div>
     </div>
   );
 }
 
 export function NewsDetailSkeleton() {
   return (
     <div className="container mx-auto px-4 py-20 max-w-4xl animate-in fade-in duration-500">
       <Skeleton className="h-6 w-32 mb-8" />
       <div className="space-y-6 mb-12">
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-16 w-full" />
         <div className="flex gap-4 border-y py-4">
           <Skeleton className="h-5 w-40" />
           <Skeleton className="h-5 w-32" />
         </div>
       </div>
       <Skeleton className="aspect-[21/9] w-full rounded-3xl mb-12" />
       <div className="space-y-4 mb-16">
         <Skeleton className="h-6 w-full" />
         <Skeleton className="h-6 w-full" />
         <Skeleton className="h-6 w-5/6" />
         <Skeleton className="h-6 w-full" />
         <Skeleton className="h-6 w-4/5" />
       </div>
     </div>
   );
 }
 
 export function PanelSkeleton() {
   return (
     <div className="container mx-auto px-4 py-12 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
         <div className="space-y-4">
           <Skeleton className="h-12 w-64" />
           <Skeleton className="h-6 w-96 max-w-full" />
         </div>
         <div className="flex gap-4">
           <Skeleton className="h-12 w-32 rounded-xl" />
           <Skeleton className="h-12 w-12 rounded-xl" />
         </div>
       </div>
       
       <div className="grid gap-8 lg:grid-cols-3">
         <div className="lg:col-span-2 space-y-8">
           <div className="grid gap-6 sm:grid-cols-2">
             {[1, 2, 3, 4].map(i => (
               <Skeleton key={i} className="h-32 rounded-3xl" />
             ))}
           </div>
           <div className="space-y-4">
             <Skeleton className="h-10 w-48" />
             <Skeleton className="h-64 w-full rounded-3xl" />
           </div>
         </div>
         <div className="space-y-8">
           <Skeleton className="h-[500px] w-full rounded-3xl" />
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
            <Skeleton className="h-16 w-3/4 md:h-24 rounded-2xl" />
            <Skeleton className="h-5 w-full rounded-lg" />
            <Skeleton className="h-5 w-2/3 rounded-lg" />
            <div className="flex flex-wrap gap-3 mt-8">
              <Skeleton className="h-12 w-40 rounded-xl" />
              <Skeleton className="h-12 w-48 rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 space-y-0">
        <SectionSkeleton type="cards" count={3} />
        <SectionSkeleton type="lots" count={3} />
        <SectionSkeleton type="articles" count={4} />
      </div>
    </div>
  );
}