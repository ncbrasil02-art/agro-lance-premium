 import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";

export function SellerCarousel() {
  const [sellers, setSellers] = useState<any[]>([]);
   const [customTexts, setCustomTexts] = useState({
     partners_title: "Nossos Parceiros",
     partners_subtitle: "Vendedores"
   });

  useEffect(() => {
     const fetchData = async () => {
       const { data: sellersData } = await supabase
         .from("sellers")
         .select("*")
         .not("logo_url", "is", null)
         .neq("logo_url", "")
         .limit(20);
       if (sellersData) setSellers(sellersData);
 
       const { data: settingsData } = await supabase
         .from("site_settings")
         .select("value")
         .eq("key", "custom_texts")
         .single();
       
       if (settingsData?.value) {
         const val = settingsData.value as any;
         setCustomTexts({
           partners_title: val.partners_title || "Nossos Parceiros",
           partners_subtitle: val.partners_subtitle || "Vendedores"
         });
       }
     };
     fetchData();
  }, []);

  if (sellers.length === 0) return null;

   // Função para separar a última palavra para o gradiente
   const splitText = (text: string) => {
     const words = text.split(" ");
     if (words.length <= 1) return { main: text, last: "" };
     const last = words.pop();
     return { main: words.join(" "), last };
   };
 
   const subtitleParts = useMemo(() => splitText(customTexts.partners_subtitle), [customTexts.partners_subtitle]);
 
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
         <h2 className="text-base font-black uppercase tracking-[0.3em] text-gold mb-2">
           {customTexts.partners_title}
         </h2>
         <p className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
           {subtitleParts.main}{" "}
           {subtitleParts.last && (
             <span className="bg-gradient-to-r from-gold via-white to-gold bg-clip-text text-transparent">
               {subtitleParts.last}
             </span>
           )}
         </p>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex gap-8 items-center animate-scroll whitespace-nowrap">
          {/* Duplicate for seamless scroll */}
          {[...sellers, ...sellers].map((seller, idx) => (
            <motion.div
              key={`${seller.id}-${idx}`}
               className="inline-block w-48 h-28 shrink-0"
              whileHover={{ scale: 1.05 }}
            >
               <div className="w-full h-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center justify-center transition-all duration-500">
                <OptimizedImage
                  src={seller.logo_url}
                  alt={seller.name}
                  className="max-w-full max-h-full object-contain"
                   width={192}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          width: max-content;
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}} />
    </section>
  );
}