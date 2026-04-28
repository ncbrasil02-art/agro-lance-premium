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
    secondary_color: string;
    accent_color: string;
    background_color: string;
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
    const [theme, setTheme] = useState<ThemeSettings | null>(null);
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
            if (!item.value) return;
             if (item.key === "site_info") setSiteInfo(prev => ({ ...prev, ...(item.value as any) } as any));
             if (item.key === "theme") setTheme(prev => ({ ...prev, ...(item.value as any) } as any));
             if (item.key === "homepage_sections") setHomepage(prev => ({ ...prev, ...(item.value as any) } as any));
          });
        } catch (error: any) {
          console.error("Error fetching site settings:", error);
          setIsLoading(false);
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
          
           if (updated.key === "site_info") setSiteInfo(prev => ({ ...prev, ...(updated.value as any) } as any));
           if (updated.key === "theme") setTheme(prev => ({ ...prev, ...(updated.value as any) } as any));
           if (updated.key === "homepage_sections") setHomepage(prev => ({ ...prev, ...(updated.value as any) } as any));
        })
        .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, []);
 
   return { siteInfo, theme, homepage, isLoading };
 }