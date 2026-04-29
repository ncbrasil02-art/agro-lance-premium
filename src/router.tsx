import { createRouter, useRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

 import { ErrorFallback } from "@/components/ui/error-fallback";
 
 function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
   return <ErrorFallback error={error} reset={reset} />;
 }

export const getRouter = () => {
  const router = createRouter({
    routeTree,
     context: { siteInfo: null, theme: null, homepage: null },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
