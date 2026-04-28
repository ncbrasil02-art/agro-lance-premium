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
 
 export function useSiteSettings(initialData?: { siteInfo?: SiteInfo | null, theme?: ThemeSettings | null, homepage?: HomepageSettings | null }) {
   const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(initialData?.siteInfo || null);
   const [theme, setTheme] = useState<ThemeSettings | null>(initialData?.theme || null);
   const [homepage, setHomepage] = useState<HomepageSettings | null>(initialData?.homepage || null);
   const [isLoading, setIsLoading] = useState(!initialData);
 
   useEffect(() => {
     async function fetchSettings() {
        if (initialData) {
          setIsLoading(false);
          return;
        }
       try {
         const { data, error } = await supabase
           .from("site_settings")
           .select("key, value");
         
         if (error) throw error;
 
          const info = data.find(i => i.key === "site_info")?.value as any as SiteInfo;
          const themeSettings = data.find(i => i.key === "theme")?.value as any as ThemeSettings;
          const homeSettings = data.find(i => i.key === "homepage_sections")?.value as any as HomepageSettings;

          if (info) setSiteInfo(info);
          if (themeSettings) setTheme(themeSettings);
          if (homeSettings) setHomepage(homeSettings);
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