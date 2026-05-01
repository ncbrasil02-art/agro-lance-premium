  export interface AboutPageSettings {
    enabled: boolean;
    title: string;
    content?: string;
    features?: Array<{
      icon: string;
      title: string;
      desc: string;
    }>;
  }
 
  import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
  import { useRealtimeFallback } from "./useRealtimeFallback";
 
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
  template_id?: 'model1' | 'model2' | 'model3';
  hero_backgrounds?: string[];
  hero_bg_opacity?: number;
  hero_bg_blur?: number;
  mobile_mode_enabled?: boolean;
 }
 
  export interface CustomTexts {
    hero_title: string;
    hero_subtitle: string;
    footer_text: string;
  hero_phrases?: string[];
  }
 
    export function useSiteSettings(initialData?: { 
      siteInfo?: SiteInfo | null, 
      theme?: ThemeSettings | null, 
      homepage?: HomepageSettings | null, 
      customTexts?: CustomTexts | null, 
      aboutPage?: AboutPageSettings | null 
    }) {
      const [aboutPage, setAboutPage] = useState<AboutPageSettings | null>(initialData?.aboutPage || null);
      const [customTexts, setCustomTexts] = useState<CustomTexts | null>(initialData?.customTexts || null);
      const [siteInfo, setSiteInfo] = useState<SiteInfo | null>(initialData?.siteInfo || null);
      const [theme, setTheme] = useState<ThemeSettings | null>(initialData?.theme || null);
      const [homepage, setHomepage] = useState<HomepageSettings | null>(initialData?.homepage || null);
      const [isLoading, setIsLoading] = useState(!initialData);

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

      const [status, setStatus] = useState<string>("INITIAL");

      const fetchSettings = useCallback(async () => {
        const hasInitialData = initialData && (initialData.siteInfo || initialData.theme || initialData.homepage);
        if (hasInitialData && isLoading) {
           setIsLoading(false);
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
        } finally {
          setIsLoading(false);
        }
      }, [initialData, isLoading]);

      useEffect(() => {
        fetchSettings();
      }, [fetchSettings]);

      useEffect(() => {
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
          .subscribe((newStatus) => {
            setStatus(newStatus);
          });

        return () => {
          supabase.removeChannel(channel);
        };
      }, []);

      useRealtimeFallback({
        status,
        onUpdate: fetchSettings,
        label: "Site Settings",
        pollInterval: 60000,
        initialPollInterval: 15000
      });
 
    return { siteInfo, theme, homepage, customTexts, aboutPage, isLoading };
 }