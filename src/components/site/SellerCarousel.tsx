import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { OptimizedImage } from "@/components/ui/optimized-image";

export function SellerCarousel() {
  const [sellers, setSellers] = useState<any[]>([]);

  useEffect(() => {
    const fetchSellers = async () => {
      const { data } = await supabase
        .from("sellers")
        .select("*")
        .not("logo_url", "is", null)
        .neq("logo_url", "")
        .limit(20);
      if (data) setSellers(data);
    };
    fetchSellers();
  }, []);

  if (sellers.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gold mb-2">Nossos Parceiros</h2>
        <p className="text-3xl font-black uppercase italic tracking-tighter">Vendedores de Elite</p>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex gap-8 items-center animate-scroll whitespace-nowrap">
          {/* Duplicate for seamless scroll */}
          {[...sellers, ...sellers].map((seller, idx) => (
            <motion.div
              key={`${seller.id}-${idx}`}
              className="inline-block w-40 h-24 shrink-0"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-full h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-500">
                <OptimizedImage
                  src={seller.logo_url}
                  alt={seller.name}
                  className="max-w-full max-h-full object-contain"
                  width={160}
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