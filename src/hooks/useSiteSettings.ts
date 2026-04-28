  export interface AboutPageSettings {
    enabled: boolean;
    title: string;
  }
 
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
 
  export interface CustomTexts {
    hero_title: string;
    hero_subtitle: string;
    footer_text: string;
  }
 
   export function useSiteSettings(initialData?: { siteInfo?: SiteInfo | null, theme?: ThemeSettings | null, homepage?: HomepageSettings | null, customTexts?: CustomTexts | null, aboutPage?: AboutPageSettings | null }) {
     const [aboutPage, setAboutPage] = useState<AboutPageSettings | null>(null);
     const [customTexts, setCustomTexts] = useState<CustomTexts | null>(null);
    const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(null);
    const [theme, setTheme] = useState<ThemeSettings | null>(null);
    const [homepage, setHomepage] = useState<HomepageSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Sync with initialData changes
    useEffect(() => {
      if (initialData) {
        if (initialData.siteInfo) setSiteInfo(initialData.siteInfo);
        if (initialData.theme) setTheme(initialData.theme);
         if (initialData.homepage) setHomepage(initialData.homepage);
         if (initialData.customTexts) setCustomTexts(initialData.customTexts);
         if (initialData.aboutPage) setAboutPage(initialData.aboutPage);
        setIsLoading(false);
      }
    }, [initialData?.siteInfo, initialData?.theme, initialData?.homepage]);

     useEffect(() => {
       async function fetchSettings() {
         // Only skip fetch if we actually have data in initialData
         const hasInitialData = initialData && (initialData.siteInfo || initialData.theme || initialData.homepage);
         
         if (hasInitialData) {
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
           const textsSettings = data.find(i => i.key === "custom_texts")?.value as any as CustomTexts;
           const aboutSettings = data.find(i => i.key === "about_page")?.value as any as AboutPageSettings;

          if (info) setSiteInfo(info);
          if (themeSettings) setTheme(themeSettings);
           if (homeSettings) setHomepage(homeSettings);
           if (textsSettings) setCustomTexts(textsSettings);
           if (aboutSettings) setAboutPage(aboutSettings);
        } catch (error: any) {
          console.error("Error fetching site settings:", error);
          setIsLoading(false);
        } finally {
         setIsLoading(false);
       }
     }
 
     fetchSettings();
 
       // Real-time updates - using unique channel name to avoid "already subscribed" errors
       const channelId = `site-settings-${Math.random().toString(36).substring(2, 9)}`;
       const channel = supabase
         .channel(channelId)
         .on(
           "postgres_changes",
           { event: "*", schema: "public", table: "site_settings" },
           (payload) => {
             const updated: any = payload.new;
             if (!updated || !updated.key) return;
             
             if (updated.key === "site_info") setSiteInfo(prev => ({ ...prev, ...(updated.value as any) } as any));
             if (updated.key === "theme") setTheme(prev => ({ ...prev, ...(updated.value as any) } as any));
              if (updated.key === "homepage_sections") setHomepage(prev => ({ ...prev, ...(updated.value as any) } as any));
              if (updated.key === "custom_texts") setCustomTexts(prev => ({ ...prev, ...(updated.value as any) } as any));
              if (updated.key === "about_page") setAboutPage(prev => ({ ...prev, ...(updated.value as any) } as any));
           }
         )
         .subscribe();

       return () => {
         supabase.removeChannel(channel);
       };
   }, []);
 
    return { siteInfo, theme, homepage, customTexts, aboutPage, isLoading };
 }