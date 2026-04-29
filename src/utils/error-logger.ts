 import { supabase } from "@/integrations/supabase/client";
 
 export async function logErrorToDb(functionName: string, error: any, context?: any) {
   try {
     const errorMessage = error instanceof Error ? error.message : String(error);
     const errorContext = context ? JSON.stringify(context) : (error instanceof Error ? error.stack : null);
 
     console.error(`[Logging error from ${functionName}]:`, errorMessage);
 
     const { error: insertError } = await supabase
       .from("db_errors")
       .insert({
         function_name: functionName,
         error_message: errorMessage,
         error_context: errorContext,
       });
 
     if (insertError) {
       console.error("Failed to log error to database:", insertError);
     }
   } catch (err) {
     console.error("Fatal error in logErrorToDb:", err);
   }
 }
 
 export function setupGlobalErrorLogging() {
   if (typeof window === "undefined") return;
 
   const handleWindowError = (event: ErrorEvent) => {
     logErrorToDb("window.onerror", event.error || event.message, { 
       source: event.filename, 
       lineno: event.lineno, 
       colno: event.colno 
     });
   };
 
   const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
     logErrorToDb("window.onunhandledrejection", event.reason);
   };
 
   window.addEventListener('error', handleWindowError);
   window.addEventListener('unhandledrejection', handleUnhandledRejection);
 
   return () => {
     window.removeEventListener('error', handleWindowError);
     window.removeEventListener('unhandledrejection', handleUnhandledRejection);
   };
 }