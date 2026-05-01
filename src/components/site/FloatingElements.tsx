 import { motion } from "framer-motion";
 import { Gavel, Cherry as Cow, Ghost as Horse, Wheat, Sparkles } from "lucide-react";
 
 const icons = [
   { Icon: Gavel, size: 40, color: "text-gold/10" },
   { Icon: Cow, size: 60, color: "text-white/5" },
   { Icon: Horse, size: 50, color: "text-gold/5" },
   { Icon: Wheat, size: 30, color: "text-white/10" },
   { Icon: Sparkles, size: 20, color: "text-gold/20" },
 ];
 
 export const FloatingElements = () => {
   return (
     <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
       {[...Array(15)].map((_, i) => {
         const item = icons[i % icons.length];
         const Icon = item.Icon;
         return (
           <motion.div
             key={i}
             className={`absolute ${item.color}`}
             initial={{ 
               x: `${Math.random() * 100}%`, 
               y: `${Math.random() * 100}%`,
               opacity: 0,
               rotate: 0
             }}
             animate={{ 
               y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
               x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
               opacity: [0, 1, 1, 0],
               rotate: [0, 360]
             }}
             transition={{ 
               duration: 20 + Math.random() * 30, 
               repeat: Infinity,
               ease: "linear"
             }}
           >
             <Icon size={item.size + Math.random() * 20} />
           </motion.div>
         );
       })}
     </div>
   );
 };