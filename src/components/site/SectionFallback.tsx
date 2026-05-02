 import { motion } from "framer-motion";
 import { Sparkles, AlertCircle } from "lucide-react";
 import { cn } from "@/lib/utils";
 
 interface SectionFallbackProps {
   title?: string;
   message?: string;
   className?: string;
   variant?: "empty" | "error";
 }
 
 export function SectionFallback({ 
   title = "Em breve novidades", 
   message = "Estamos preparando as melhores oportunidades para você. Fique atento!", 
   className,
   variant = "empty"
 }: SectionFallbackProps) {
   return (
     <motion.div 
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       className={cn(
         "container mx-auto px-4 py-16 flex flex-col items-center text-center",
         className
       )}
     >
       <div className={cn(
         "mb-6 h-20 w-20 rounded-full flex items-center justify-center border shadow-xl",
         variant === "error" ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-gold/10 border-gold/20 text-gold"
       )}>
         {variant === "error" ? <AlertCircle className="h-10 w-10" /> : <Sparkles className="h-10 w-10 animate-pulse" />}
       </div>
       <h3 className="text-3xl font-black uppercase italic tracking-tighter text-foreground mb-4">
         {title}
       </h3>
       <p className="text-muted-foreground text-lg max-w-md font-medium italic">
         {message}
       </p>
       <div className="mt-8 h-1 w-24 bg-gradient-to-r from-transparent via-gold/30 to-transparent rounded-full" />
     </motion.div>
   );
 }