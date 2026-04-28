import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import { Button } from "./button";

interface ErrorFallbackProps {
  error: Error;
  reset?: () => void;
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  const router = useRouter();

  const handleReset = () => {
    if (reset) {
      reset();
    } else {
      router.invalidate();
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-destructive/20 blur-2xl animate-pulse" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Ops! Algo deu errado</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Não foi possível carregar os dados desta página no momento. Por favor, tente novamente.
      </p>
      
      {true && (
        <div className="mt-4 max-w-lg overflow-auto rounded-lg bg-muted p-4 text-left text-xs font-mono text-destructive">
          {error.message}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Button 
          onClick={handleReset}
          className="bg-gold text-emerald-deep hover:bg-gold/90 font-bold"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Tentar novamente
        </Button>
        <Link to="/">
          <Button variant="outline" className="border-border">
            <Home className="mr-2 h-4 w-4" />
            Ir para Home
          </Button>
        </Link>
      </div>
    </div>
  );
}