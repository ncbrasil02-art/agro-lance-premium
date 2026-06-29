import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Gavel, Wheat, Trees, Sprout, Tractor, Leaf, Sparkles } from "lucide-react";
 
 const icons = [
   { Icon: Gavel, size: 40, color: "text-gold/10" },
  { Icon: Wheat, size: 45, color: "text-white/5" },
  { Icon: Trees, size: 50, color: "text-gold/5" },
  { Icon: Sprout, size: 30, color: "text-white/10" },
  { Icon: Tractor, size: 55, color: "text-gold/5" },
  { Icon: Leaf, size: 25, color: "text-white/5" },
  { Icon: Sparkles, size: 15, color: "text-gold/20" },
 ];
 
 export const FloatingElements = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 15 }, (_, i) => {
      const item = icons[i % icons.length];
      return {
        Icon: item.Icon,
        color: item.color,
        size: item.size + Math.random() * 20,
        x0: Math.random() * 100,
        y0: Math.random() * 100,
        x1: Math.random() * 100,
        y1: Math.random() * 100,
        duration: 20 + Math.random() * 30,
      };
    });
  }, [mounted]);

  if (!mounted) return null;

   return (
     <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {items.map((it, i) => {
        const Icon = it.Icon;
         return (
           <motion.div
             key={i}
            className={`absolute ${it.color}`}
            initial={{ x: `${it.x0}%`, y: `${it.y0}%`, opacity: 0, rotate: 0 }}
            animate={{
              y: [`${it.y0}%`, `${it.y1}%`],
              x: [`${it.x0}%`, `${it.x1}%`],
              opacity: [0, 1, 1, 0],
              rotate: [0, 360],
            }}
            transition={{ duration: it.duration, repeat: Infinity, ease: "linear" }}
           >
            <Icon size={it.size} />
           </motion.div>
         );
       })}
     </div>
   );
 };