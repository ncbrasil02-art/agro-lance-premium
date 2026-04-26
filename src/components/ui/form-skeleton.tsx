import { Skeleton } from "./skeleton";

export function FormSkeleton() {
  return (
    <div className="container mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12 animate-in fade-in duration-500">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-elegant space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}