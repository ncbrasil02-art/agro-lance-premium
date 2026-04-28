 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
 export interface SiteInfo {
   name: string;
   email: string;
   phone: string;
   cnpj: string;
   logo_url: string;
 }
 
 export interface ThemeSettings {
   primary_color: string;
   primary_foreground_color?: string;
   secondary_color: string;
   secondary_foreground_color?: string;
   accent_color: string;
   accent_foreground_color?: string;
   background_color: string;
   foreground_color?: string;
   card_color?: string;
   card_foreground_color?: string;
   popover_color?: string;
   popover_foreground_color?: string;
   muted_color?: string;
   muted_foreground_color?: string;
   border_color?: string;
   input_color?: string;
   ring_color?: string;
   destructive_color?: string;
   destructive_foreground_color?: string;
   live_color?: string;
   upcoming_color?: string;
   closed_color?: string;
 }
 
 export interface HomepageSettings {
   show_articles: boolean;
   show_upcoming_events: boolean;
   show_featured_lots: boolean;
   show_sale_menu: boolean;
   show_animated_slides: boolean;
   order: string[];
 }
 
 export function useSiteSettings() {
   const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
    const [theme, setTheme] = useState<ThemeSettings>({
      primary_color: "#D4AF37",
      secondary_color: "#064E3B",
      accent_color: "#10B981",
      background_color: "#022C22"
    });
   const [homepage, setHomepage] = useState<HomepageSettings | null>(null);
   const [isLoading, setIsLoading] = useState(true);
 
   useEffect(() => {
     async function fetchSettings() {
       try {
         const { data, error } = await supabase
           .from("site_settings")
           .select("key, value");
         
         if (error) throw error;
 
          data.forEach(item => {
            if (item.key === "site_info") setSiteInfo(prev => ({ ...prev, ...(item.value as any) }));
            if (item.key === "theme") setTheme(prev => ({ ...prev, ...(item.value as any) }));
            if (item.key === "homepage_sections") setHomepage(prev => ({ ...prev, ...(item.value as any) }));
          });
       } catch (error) {
         console.error("Error fetching site settings:", error);
       } finally {
         setIsLoading(false);
       }
     }
 
     fetchSettings();
 
     // Real-time updates
      const channel = supabase
        .channel("site-settings-global")
        .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (payload) => {
          const updated: any = payload.new;
          if (!updated || !updated.key) return;
          
          if (updated.key === "site_info") setSiteInfo(prev => ({ ...prev, ...(updated.value as any) }));
          if (updated.key === "theme") setTheme(prev => ({ ...prev, ...(updated.value as any) }));
          if (updated.key === "homepage_sections") setHomepage(prev => ({ ...prev, ...(updated.value as any) }));
        })
        .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, []);
 
   return { siteInfo, theme, homepage, isLoading };
 }