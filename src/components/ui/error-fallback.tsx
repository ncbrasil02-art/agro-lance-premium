 import React, { Component, ReactNode, useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
 import { logErrorToDb } from "@/utils/error-logger";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  tag?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
     logErrorToDb(`ErrorBoundary${this.props.tag ? `:${this.props.tag}` : ""}`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 text-center border border-destructive/20 rounded-xl bg-destructive/5 my-4">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-medium text-destructive">Falha ao carregar componente</p>
          {this.state.error && (
            <p className="text-xs text-muted-foreground mt-1">{this.state.error.message}</p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
import { Button } from "./button";

interface ErrorFallbackProps {
  error: Error;
  reset?: () => void;
}

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  const router = useRouter();
 
   useEffect(() => {
     logErrorToDb("ErrorFallback", error);
   }, [error]);

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
      
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 max-w-lg overflow-auto rounded-lg bg-muted p-4 text-left text-xs font-mono text-destructive">
          {error?.message || 'Erro desconhecido'}
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