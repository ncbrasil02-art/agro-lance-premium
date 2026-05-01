 import { validateImage } from "@/utils/upload-validation";
 import { cn } from "@/lib/utils";
 import { Badge } from "@/components/ui/badge";
 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Switch } from "@/components/ui/switch";
 import { toast } from "sonner";
 import { Loader2, Save, Upload, Palette, Home, Info, ArrowUp, ArrowDown, Wand2, History, Trash2, Check, FileText, Type, Plus, Star, Search, Globe, ShieldCheck, Zap, Layout, Newspaper, GripVertical } from "lucide-react";
 import { Reorder } from "framer-motion";
 import { BulkSeoAudit } from "./BulkSeoAudit";
 import { LotCard } from "../auctions/lot-card";
 import { OptimizedImage } from "@/components/ui/optimized-image";

 function ColorPicker({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) {
   return (
     <div className="space-y-2">
       <Label className="text-xs font-medium text-muted-foreground uppercase">{label}</Label>
       <div className="flex gap-2">
         <Input 
           type="color" 
           className="w-12 h-10 p-1 cursor-pointer" 
           value={value} 
           onChange={e => onChange(e.target.value)}
         />
         <Input 
           value={value} 
           onChange={e => onChange(e.target.value)}
           className="font-mono text-sm"
         />
       </div>
     </div>
   );
 }
 
 export function SiteSettings({ initialTab = "geral" }: { initialTab?: string }) {
    const [isLoading, setIsLoading] = useState(true);
    const [seoSettings, setSeoSettings] = useState({
      global_title_suffix: " | Premium Agro Leilões",
      global_description: "A melhor plataforma de leilões agropecuários do Brasil.",
      home_title: "Home",
      home_description: "",
      about_title: "Sobre",
      about_description: "",
      news_title: "Notícias",
      news_description: "",
      home_og_title: "",
      home_og_description: "",
      home_og_image: "",
      about_og_title: "",
      about_og_description: "",
      about_og_image: "",
      google_analytics_id: "",
      facebook_pixel_id: "",
      twitter_handle: "@agropremium",
      og_default_image: ""
    });
     const [aboutPage, setAboutPage] = useState({
       enabled: true,
       title: "Sobre",
       content: "Somos a plataforma brasileira que está redefinindo a experiência dos leilões agropecuários — unindo tradição rural, curadoria genética rigorosa e tecnologia de tempo real.",
       features: [
         { icon: "Radio", title: "Tempo real", desc: "Lances instantâneos com WebSocket de baixa latência." },
         { icon: "ShieldCheck", title: "Segurança total", desc: "Aprovação manual de cadastros e contratos digitais." },
         { icon: "Trophy", title: "Curadoria premium", desc: "Avaliação veterinária e genealógica dos animais." },
         { icon: "Users", title: "Comunidade qualificada", desc: "Compradores e vendedores verificados." }
       ]
     });

    const [customTexts, setCustomTexts] = useState({
      hero_title: "",
      hero_subtitle: "",
      footer_text: "",
      partners_title: "Nossos Parceiros",
      partners_subtitle: "Vendedores",
      hero_phrases: [] as string[]
    });
   const [isSaving, setIsSaving] = useState(false);
   const [isUploading, setIsUploading] = useState(false);
    const [baseColor, setBaseColor] = useState("#D4AF37");
    const [savedPalettes, setSavedPalettes] = useState<any[]>([]);
    const [animations, setAnimations] = useState({
      badge_blink: true,
      badge_glow: true,
      bid_button_pulse: true,
      animal_name_entry: "slide-up",
      card_hover_tilt: true,
      enable_confetti: true
    });
 
   const [siteInfo, setSiteInfo] = useState({
     name: "",
     email: "",
     phone: "",
     cnpj: "",
      logo_url: "",
      site_url: ""
   });
 
   const [theme, setTheme] = useState<any>({
      primary_color: "#D4AF37",
      primary_foreground_color: "#022C22",
      secondary_color: "#064E3B",
      secondary_foreground_color: "#F8FAFC",
      accent_color: "#10B981",
      accent_foreground_color: "#F8FAFC",
      background_color: "#022C22",
      foreground_color: "#F8FAFC",
      card_color: "#064E3B",
      card_foreground_color: "#F8FAFC",
      popover_color: "#064E3B",
      popover_foreground_color: "#F8FAFC",
      muted_color: "#0F172A",
      muted_foreground_color: "#94A3B8",
      border_color: "#1E293B",
      input_color: "#1E293B",
      ring_color: "#D4AF37",
      destructive_color: "#EF4444",
      destructive_foreground_color: "#F8FAFC",
      live_color: "#EF4444",
      upcoming_color: "#D4AF37",
      closed_color: "#64748B"
   });
 
    const [homepage, setHomepage] = useState<any>({
      show_articles: true,
      show_upcoming_events: true,
      show_featured_lots: true,
      show_sale_menu: true,
      show_animated_slides: true,
      mobile_mode_enabled: false,
      order: ["banners", "upcoming_events", "featured_lots", "sale_menu", "articles"],
       hero_backgrounds: [] as string[],
       hero_bg_opacity: 50,
       hero_bg_blur: 0,
       template_id: 'model1'
    });

    const [articleSettings, setArticleSettings] = useState({
      card_style: 'standard',
      show_date: true,
      show_category: true,
      show_excerpt: true,
      image_aspect_ratio: '16/9'
    });

     const [lotCardSettings, setLotCardSettings] = useState({
       media_mode: "gallery",
      displayed_fields: [
        { key: "father", label: "Pai", enabled: true },
        { key: "mother", label: "Mãe", enabled: true },
        { key: "sex", label: "Sexo", enabled: true },
        { key: "breed", label: "Raça", enabled: true },
        { key: "seller", label: "Vendedor", enabled: true },
        { key: "birth_date", label: "Data de Nasc.", enabled: false },
        { key: "registration_number", label: "Registro", enabled: false },
        { key: "vaccination_records", label: "Vacinação", enabled: false },
        { key: "location", label: "Localização", enabled: false }
      ]
    });
 
   useEffect(() => {
     fetchSettings();
   }, []);
 
   const fetchSettings = async () => {
     setIsLoading(true);
     try {
       const { data, error } = await supabase
         .from("site_settings")
         .select("key, value");
       
       if (error) throw error;
 
        const info = data.find(i => i.key === "site_info")?.value;
        const themeData = data.find(i => i.key === "theme")?.value;
          const homeData = data.find(i => i.key === "homepage_sections")?.value;
          const aboutData = data.find(i => i.key === "about_page")?.value;
          const textsData = data.find(i => i.key === "custom_texts")?.value;
          const seoData = data.find(i => i.key === "seo_settings")?.value;
         const palettes = data.find(i => i.key === "saved_palettes")?.value;
          const animData = data.find(i => i.key === "animations")?.value;
            const lotCardData = data.find(i => i.key === "lot_card_settings")?.value;
            const articleData = data.find(i => i.key === "article_settings")?.value;

         if (info) setSiteInfo((prev: any) => ({ ...prev, ...(info as any) }));
         if (themeData) setTheme((prev: any) => ({ ...prev, ...(themeData as any) }));
          if (homeData) setHomepage((prev: any) => ({ ...prev, ...(homeData as any) }));
          if (aboutData) setAboutPage((prev: any) => ({ ...prev, ...(aboutData as any) }));
          if (textsData) setCustomTexts((prev: any) => ({ ...prev, ...(textsData as any) }));
          if (seoData) setSeoSettings((prev: any) => ({ ...prev, ...(seoData as any) }));
         if (palettes && Array.isArray(palettes)) setSavedPalettes(palettes);
          if (animData) setAnimations((prev: any) => ({ ...prev, ...(animData as any) }));
          if (lotCardData) setLotCardSettings((prev: any) => ({ ...prev, ...(lotCardData as any) }));
          if (articleData) setArticleSettings((prev: any) => ({ ...prev, ...(articleData as any) }));
     } catch (error: any) {
       toast.error("Erro ao carregar configurações: " + error.message);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleSave = async (key: string, value: any) => {
     setIsSaving(true);
     try {
       const { error } = await supabase
         .from("site_settings")
          .upsert({ key, value }, { onConflict: 'key' });
       
       if (error) throw error;
       toast.success("Configurações salvas com sucesso!");
     } catch (error: any) {
       toast.error("Erro ao salvar: " + error.message);
     } finally {
       setIsSaving(false);
     }
   };
 
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !validateImage(file)) return;
  
      setIsUploading(true);
     try {
       const fileExt = file.name.split('.').pop();
       const fileName = `logo-${Math.random()}.${fileExt}`;
       const { error: uploadError } = await supabase.storage
         .from('public_assets')
         .upload(fileName, file);
 
       if (uploadError) throw uploadError;
 
       const { data: { publicUrl } } = supabase.storage
         .from('public_assets')
         .getPublicUrl(fileName);
 
        setSiteInfo(prev => ({ ...prev, logo_url: publicUrl }));
        toast.success("Logo enviado com sucesso!");
      } catch (error: any) {
        toast.error("Erro no upload do logo: " + error.message);
      } finally {
        setIsUploading(false);
      }
    };

    const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const file = e.target.files?.[0];
      if (!file || !validateImage(file)) return;

      setIsUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `slide-${index}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('public_assets')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public_assets')
          .getPublicUrl(fileName);

        const newBgs = [...(homepage.hero_backgrounds || [])];
        newBgs[index] = publicUrl;
        setHomepage({ ...homepage, hero_backgrounds: newBgs });
        toast.success("Imagem do slide enviada!");
      } catch (error: any) {
        toast.error("Erro no upload da imagem: " + error.message);
      } finally {
        setIsUploading(false);
      }
    };

    const moveSection = async (index: number, direction: 'up' | 'down') => {
     const newOrder = [...homepage.order];
     const newIndex = direction === 'up' ? index - 1 : index + 1;
     
     if (newIndex < 0 || newIndex >= newOrder.length) return;
     
     const temp = newOrder[index];
     newOrder[index] = newOrder[newIndex];
     newOrder[newIndex] = temp;
     
        const updatedHomepage = { ...homepage, order: newOrder };
        setHomepage(updatedHomepage);
        
        // Auto-save the new section order
        try {
          await supabase.from("site_settings").upsert({ key: "homepage_sections", value: updatedHomepage }, { onConflict: 'key' });
          toast.success("Ordem das seções salva!");
        } catch (err) {
          console.error("Erro ao salvar ordem das seções:", err);
        }
   };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center p-12">
         <Loader2 className="h-8 w-8 animate-spin text-gold" />
       </div>
     );
   }
 
   const AVAILABLE_TEMPLATES = [
     {
       id: 'model1',
       name: 'Elite',
       description: 'O design padrão e sofisticado do seu site.',
       image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80',
       color: 'gold'
     }
   ];

   const sectionLabels: Record<string, string> = {
     banners: "Banners / Slides Animados",
     upcoming_events: "Próximos Eventos",
     featured_lots: "Lotes em Destaque",
     sale_menu: "Menu de Vendas",
     articles: "Artigos e Notícias"
   };
 
    const generatePalette = () => {
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
      };

      const rgbToHex = (r: number, g: number, b: number) => {
        return "#" + [r, g, b].map(x => {
          const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        }).join("");
      };

      const adjust = (hex: string, percent: number) => {
        const { r, g, b } = hexToRgb(hex);
        const amount = Math.floor(255 * (percent / 100));
        return rgbToHex(
          Math.max(0, Math.min(255, r + amount)),
          Math.max(0, Math.min(255, g + amount)),
          Math.max(0, Math.min(255, b + amount))
        );
      };

      const newTheme = {
        ...theme,
        primary_color: baseColor,
        primary_foreground_color: "#ffffff",
        secondary_color: adjust(baseColor, -40),
        secondary_foreground_color: "#ffffff",
        accent_color: adjust(baseColor, 10),
        background_color: adjust(baseColor, -85),
        foreground_color: "#f8fafc",
        card_color: adjust(baseColor, -75),
        card_foreground_color: "#f8fafc",
        popover_color: adjust(baseColor, -75),
        popover_foreground_color: "#f8fafc",
        border_color: adjust(baseColor, -50),
        ring_color: baseColor,
      };

      setTheme(newTheme);
      toast.success("Nova paleta gerada!");
    };

    const savePalette = async () => {
      const newPalettes = [theme, ...savedPalettes].slice(0, 5);
      setSavedPalettes(newPalettes);
      await handleSave("saved_palettes", newPalettes);
    };

    const deletePalette = async (index: number) => {
      const newPalettes = savedPalettes.filter((_, i) => i !== index);
      setSavedPalettes(newPalettes);
      await handleSave("saved_palettes", newPalettes);
    };

    return (
      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="templates" className="gap-2">
            <Layout className="h-4 w-4" /> Modelos
          </TabsTrigger>
          <TabsTrigger value="geral" className="gap-2">
            <Info className="h-4 w-4" /> Geral
          </TabsTrigger>
         <TabsTrigger value="visual" className="gap-2">
           <Palette className="h-4 w-4" /> Visual
         </TabsTrigger>
          <TabsTrigger value="homepage" className="gap-2">
            <Home className="h-4 w-4" /> Página Inicial
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4" /> Conteúdo
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Globe className="h-4 w-4" /> SEO
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <ShieldCheck className="h-4 w-4" /> Auditoria SEO
          </TabsTrigger>
          <TabsTrigger value="articles" className="gap-2">
             <Newspaper className="h-4 w-4" /> Artigos
           </TabsTrigger>
           <TabsTrigger value="lots" className="gap-2">
             <Star className="h-4 w-4" /> Lotes
           </TabsTrigger>
         </TabsList>
        <TabsContent value="articles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-gold" /> Personalização de Notícias
              </CardTitle>
              <CardDescription>Configure como os cards de notícias e artigos aparecem no site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estilo do Card</Label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                      value={articleSettings.card_style}
                      onChange={e => setArticleSettings({...articleSettings, card_style: e.target.value as any})}
                    >
                      <option value="standard">Padrão</option>
                      <option value="glass">Efeito Vidro (Glassmorphism)</option>
                      <option value="modern">Moderno (Sem bordas, Minimalista)</option>
                      <option value="traditional">Tradicional (Bordas fortes, Elite)</option>
                      <option value="minimal">Minimalista</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Proporção da Imagem</Label>
                    <select 
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                      value={articleSettings.image_aspect_ratio}
                      onChange={e => setArticleSettings({...articleSettings, image_aspect_ratio: e.target.value as any})}
                    >
                      <option value="16/9">Widescreen (16:9)</option>
                      <option value="4/3">Clássico (4:3)</option>
                      <option value="1/1">Quadrado (1:1)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_date">Mostrar Data de Publicação</Label>
                    <Switch 
                      id="show_date" 
                      checked={articleSettings.show_date} 
                      onCheckedChange={v => setArticleSettings({...articleSettings, show_date: v})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_cat">Mostrar Categoria</Label>
                    <Switch 
                      id="show_cat" 
                      checked={articleSettings.show_category} 
                      onCheckedChange={v => setArticleSettings({...articleSettings, show_category: v})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_exc">Mostrar Resumo (Excerpt)</Label>
                    <Switch 
                      id="show_exc" 
                      checked={articleSettings.show_excerpt} 
                      onCheckedChange={v => setArticleSettings({...articleSettings, show_excerpt: v})} 
                    />
                  </div>
                </div>
              </div>

              <Button 
                className="w-full bg-gold text-emerald-deep font-bold mt-4" 
                onClick={() => handleSave("article_settings", articleSettings)}
                disabled={isSaving}
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Configurações de Notícias
              </Button>
            </CardContent>
          </Card>
        </TabsContent>


       <TabsContent value="templates" className="space-y-6">
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Layout className="h-5 w-5 text-gold" /> Editor de Modelos
             </CardTitle>
             <CardDescription>Escolha o estilo visual que melhor representa sua marca e reordene as seções da página inicial.</CardDescription>
           </CardHeader>
           <CardContent className="space-y-8">
             <div className="grid md:grid-cols-3 gap-6">
               {AVAILABLE_TEMPLATES.map((tmpl) => (
                 <div 
                   key={tmpl.id}
                   className={cn(
                     "group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer hover:shadow-2xl",
                     homepage.template_id === tmpl.id ? "border-gold shadow-gold/20" : "border-border hover:border-gold/30"
                   )}
                   onClick={() => setHomepage({...homepage, template_id: tmpl.id})}
                 >
                   <div className="aspect-[16/10] relative overflow-hidden">
                     <img src={tmpl.image} alt={tmpl.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                     {homepage.template_id === tmpl.id && (
                       <div className="absolute top-3 right-3 bg-gold text-emerald-deep px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                         <Check className="h-3 w-3" /> Ativo
                       </div>
                     )}
                   </div>
                   <div className="p-5 bg-card">
                     <h3 className="text-lg font-black uppercase italic tracking-tighter mb-1">{tmpl.name}</h3>
                     <p className="text-xs text-muted-foreground leading-relaxed mb-4">{tmpl.description}</p>
                     <Button 
                       variant={homepage.template_id === tmpl.id ? "default" : "outline"}
                       className={cn(
                         "w-full font-black uppercase italic text-xs h-10 tracking-widest",
                         homepage.template_id === tmpl.id ? "bg-gold text-emerald-deep" : "border-gold/20 text-gold"
                       )}
                     >
                       {homepage.template_id === tmpl.id ? "Modelo Ativado" : "Selecionar Modelo"}
                     </Button>
                   </div>
                 </div>
               ))}
             </div>

             <div className="space-y-4 pt-4 border-t border-border">
               <div className="flex items-center justify-between">
                 <Label className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
                   <ArrowUp className="h-4 w-4 text-gold" /> Reordenar Seções
                 </Label>
                 <Button 
                   size="sm" 
                   className="bg-gold text-emerald-deep font-black uppercase italic text-[10px] h-8 px-4"
                   onClick={() => handleSave("homepage_sections", homepage)}
                   disabled={isSaving}
                 >
                   {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                    Salvar Layout e Ordem
                 </Button>
               </div>
               <p className="text-sm text-muted-foreground">Arraste as seções para definir em que ordem elas aparecem na página inicial.</p>
               <div className="grid gap-3">
                 {(homepage.order || []).map((sectionId: string, idx: number) => (
                   <div key={sectionId} className="flex items-center gap-3 p-4 bg-muted/30 border border-border rounded-xl group hover:bg-muted/50 transition-colors">
                     <div className="flex flex-col gap-1">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-7 w-7 text-muted-foreground hover:text-gold"
                         onClick={() => moveSection(idx, 'up')}
                         disabled={idx === 0}
                       >
                         <ArrowUp className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-7 w-7 text-muted-foreground hover:text-gold"
                         onClick={() => moveSection(idx, 'down')}
                         disabled={idx === (homepage.order || []).length - 1}
                       >
                         <ArrowDown className="h-4 w-4" />
                       </Button>
                     </div>
                     <div className="flex-1">
                       <h4 className="font-black uppercase italic text-sm tracking-tighter">{sectionLabels[sectionId] || sectionId}</h4>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Seção da Página Inicial</p>
                     </div>
                     <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                       <Badge variant="outline" className="text-[9px] uppercase tracking-tighter font-black">Posição #{idx + 1}</Badge>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           </CardContent>
         </Card>
       </TabsContent>

       <TabsContent value="content">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-gold" /> Banner de Destaque (Hero)
                </CardTitle>
                <CardDescription>Gerencie os slides (imagem + frase) do topo da página</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b">
                  <div className="space-y-2">
                    <Label>Transparência do Fundo ({homepage.hero_bg_opacity ?? 50}%)</Label>
                    <Input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={homepage.hero_bg_opacity ?? 50} 
                      onChange={e => setHomepage({...homepage, hero_bg_opacity: parseInt(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Desfoque / Nitidez ({homepage.hero_bg_blur ?? 0}px)</Label>
                    <Input 
                      type="range" 
                      min="0" 
                      max="20" 
                      value={homepage.hero_bg_blur ?? 0} 
                      onChange={e => setHomepage({...homepage, hero_bg_blur: parseInt(e.target.value)})} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-lg font-black uppercase italic tracking-tighter">Gerenciar Slides</Label>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 border-gold/50 text-gold hover:bg-gold/10"
                      onClick={() => {
                        setHomepage({...homepage, hero_backgrounds: [...(homepage.hero_backgrounds || []), ""]});
                        setCustomTexts({...customTexts, hero_phrases: [...(customTexts.hero_phrases || []), ""]});
                      }}
                    >
                      <Plus className="h-4 w-4" /> Adicionar Novo Slide
                    </Button>
                  </div>

                   <Reorder.Group 
                     axis="y" 
                     values={Array.from({ length: (homepage.hero_backgrounds || []).length }).map((_, i) => i)} 
                    onReorder={async (newOrder) => {
                      const newBgs = newOrder.map(idx => (homepage.hero_backgrounds || [])[idx]);
                      const newPhrases = newOrder.map(idx => (customTexts.hero_phrases || [])[idx]);
                      
                      const updatedHomepage = {...homepage, hero_backgrounds: newBgs};
                      const updatedCustomTexts = {...customTexts, hero_phrases: newPhrases};
                      
                      setHomepage(updatedHomepage);
                      setCustomTexts(updatedCustomTexts);
                      
                      // Persistir automaticamente após reordenar
                      try {
                        await supabase.from("site_settings").upsert({ key: "homepage_sections", value: updatedHomepage }, { onConflict: 'key' });
                        await supabase.from("site_settings").upsert({ key: "custom_texts", value: updatedCustomTexts }, { onConflict: 'key' });
                        toast.success("Ordem dos slides salva!");
                      } catch (err) {
                        console.error("Erro ao salvar ordem:", err);
                      }
                    }}
                     className="space-y-4"
                   >
                     {(homepage.hero_backgrounds || []).map((url: string, idx: number) => (
                       <Reorder.Item key={idx} value={idx}>
                         <Card className="bg-muted/10 border-gold/10 cursor-default">
                           <CardContent className="p-4 space-y-4">
                          <div className="flex justify-between items-center">
                             <div className="flex items-center gap-2">
                               <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                               <Badge variant="outline" className="text-gold border-gold/30 uppercase tracking-widest text-[10px]">Slide #{idx + 1}</Badge>
                             </div>
                             <Button 
                               variant="ghost" 
                               size="icon" 
                               className="text-destructive h-8 w-8"
                               onClick={() => {
                                 const newBgs = (homepage.hero_backgrounds || []).filter((_: any, i: number) => i !== idx);
                                 const newPhrases = (customTexts.hero_phrases || []).filter((_: any, i: number) => i !== idx);
                                 setHomepage({...homepage, hero_backgrounds: newBgs});
                                 setCustomTexts({...customTexts, hero_phrases: newPhrases});
                               }}
                             >
                               <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>

                          <div className="grid md:grid-cols-[150px_1fr] gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Imagem</Label>
                              <div className="relative group aspect-video rounded-lg overflow-hidden border border-gold/20 bg-muted/20">
                                {url ? (
                                  <OptimizedImage src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                    <Upload className="h-6 w-6" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Label className="cursor-pointer bg-gold text-emerald-deep px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    Upload
                                    <Input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*" 
                                      onChange={(e) => handleSlideImageUpload(e, idx)} 
                                    />
                                  </Label>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">URL da Imagem (Opcional)</Label>
                                <Input 
                                  placeholder="https://..." 
                                  value={url} 
                                  onChange={e => {
                                    const newBgs = [...(homepage.hero_backgrounds || [])];
                                    newBgs[idx] = e.target.value;
                                    setHomepage({...homepage, hero_backgrounds: newBgs});
                                  }} 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Frase do Slide</Label>
                                <Input 
                                  placeholder="Frase que aparecerá neste slide..." 
                                  value={customTexts.hero_phrases?.[idx] || ""} 
                                  onChange={e => {
                                    const newPhrases = [...(customTexts.hero_phrases || [])];
                                    // Ensure array is long enough
                                    while(newPhrases.length <= idx) newPhrases.push("");
                                    newPhrases[idx] = e.target.value;
                                    setCustomTexts({...customTexts, hero_phrases: newPhrases});
                                  }} 
                                />
                              </div>
                            </div>
                          </div>
                         </CardContent>
                       </Card>
                      </Reorder.Item>
                     ))}
                   </Reorder.Group>

                  <Button 
                    className="w-full bg-gold-gradient text-emerald-deep font-black uppercase tracking-widest h-12 shadow-gold" 
                    onClick={async () => {
                      await handleSave("homepage_sections", homepage);
                      await handleSave("custom_texts", customTexts);
                    }}
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <Save className="h-4 w-4 mr-2" /> Salvar Alterações dos Slides
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gold" /> Página Sobre
                </CardTitle>
                <CardDescription>Gerencie a visibilidade e o nome da página institucional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="about_enabled">Habilitar Página Sobre</Label>
                  <Switch 
                    id="about_enabled" 
                    checked={aboutPage.enabled} 
                    onCheckedChange={v => setAboutPage({...aboutPage, enabled: v})} 
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="about_title">Nome da Página (Menu/Título)</Label>
                    <Input 
                      id="about_title" 
                      value={aboutPage.title} 
                      onChange={e => setAboutPage({...aboutPage, title: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about_content">Conteúdo Principal</Label>
                  <Textarea 
                    id="about_content" 
                    className="min-h-[120px]"
                    placeholder="Breve descrição da empresa..."
                    value={aboutPage.content} 
                    onChange={e => setAboutPage({...aboutPage, content: e.target.value})} 
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold">Itens de Destaque (Features)</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setAboutPage({
                        ...aboutPage, 
                        features: [...aboutPage.features, { icon: "Star", title: "Novo Item", desc: "Descrição curta do diferencial" }]
                      })}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                    </Button>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {aboutPage.features.map((feature, idx) => (
                      <div key={idx} className="p-4 border rounded-xl space-y-3 relative group bg-muted/5">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="absolute top-1 right-1 h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newFeatures = [...aboutPage.features];
                            newFeatures.splice(idx, 1);
                            setAboutPage({...aboutPage, features: newFeatures});
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Título</Label>
                              <Input 
                                className="h-8 text-sm"
                                value={feature.title} 
                                onChange={e => {
                                  const newFeatures = [...aboutPage.features];
                                  newFeatures[idx] = { ...newFeatures[idx], title: e.target.value };
                                  setAboutPage({...aboutPage, features: newFeatures});
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Ícone</Label>
                              <Input 
                                className="h-8 text-sm"
                                placeholder="Ex: Radio, Star..."
                                value={feature.icon} 
                                onChange={e => {
                                  const newFeatures = [...aboutPage.features];
                                  newFeatures[idx] = { ...newFeatures[idx], icon: e.target.value };
                                  setAboutPage({...aboutPage, features: newFeatures});
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Descrição</Label>
                            <Textarea 
                              className="min-h-[60px] text-sm py-2"
                              value={feature.desc} 
                              onChange={e => {
                                const newFeatures = [...aboutPage.features];
                                newFeatures[idx] = { ...newFeatures[idx], desc: e.target.value };
                                setAboutPage({...aboutPage, features: newFeatures});
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full bg-gold text-emerald-deep font-bold mt-4" 
                  onClick={() => handleSave("about_page", aboutPage)}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar Página Sobre Completa
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5 text-gold" /> Textos Customizáveis
                </CardTitle>
                <CardDescription>Edite blocos de texto importantes em todo o site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="hero_title">Título da Home (Hero)</Label>
                  <Input 
                    id="hero_title" 
                    value={customTexts.hero_title} 
                    onChange={e => setCustomTexts({...customTexts, hero_title: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_subtitle">Subtítulo da Home</Label>
                  <Textarea 
                    id="hero_subtitle" 
                    value={customTexts.hero_subtitle} 
                    onChange={e => setCustomTexts({...customTexts, hero_subtitle: e.target.value})} 
                  />
                </div>

                 <div className="grid sm:grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="partners_title">Título da Seção de Parceiros</Label>
                     <Input 
                       id="partners_title" 
                       value={customTexts.partners_title} 
                       onChange={e => setCustomTexts({...customTexts, partners_title: e.target.value})} 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="partners_subtitle">Subtítulo da Seção de Parceiros</Label>
                     <Input 
                       id="partners_subtitle" 
                       value={customTexts.partners_subtitle} 
                       onChange={e => setCustomTexts({...customTexts, partners_subtitle: e.target.value})} 
                     />
                   </div>
                 </div>

                <div className="space-y-2">
                  <Label htmlFor="footer_text">Texto Institucional (Rodapé)</Label>
                  <Textarea 
                    id="footer_text" 
                    value={customTexts.footer_text} 
                    onChange={e => setCustomTexts({...customTexts, footer_text: e.target.value})} 
                  />
                </div>
                <Button 
                  className="bg-gold text-emerald-deep font-bold" 
                  onClick={() => handleSave("custom_texts", customTexts)}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar Textos Customizáveis
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
       <TabsContent value="geral">
         <Card>
           <CardHeader>
             <CardTitle>Informações do Site</CardTitle>
             <CardDescription>Configure os dados básicos da sua plataforma</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label htmlFor="site_name">Nome do Site</Label>
                   <Input 
                     id="site_name" 
                     value={siteInfo.name} 
                     onChange={e => setSiteInfo({...siteInfo, name: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="site_email">E-mail de Contato</Label>
                   <Input 
                     id="site_email" 
                     value={siteInfo.email} 
                     onChange={e => setSiteInfo({...siteInfo, email: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="site_phone">Telefone / WhatsApp</Label>
                   <Input 
                     id="site_phone" 
                     value={siteInfo.phone} 
                     onChange={e => setSiteInfo({...siteInfo, phone: e.target.value})}
                   />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="site_cnpj">CNPJ</Label>
                    <Input 
                      id="site_cnpj" 
                      value={siteInfo.cnpj} 
                      onChange={e => setSiteInfo({...siteInfo, cnpj: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_url">URL do Site (Canonical)</Label>
                    <Input 
                      id="site_url" 
                      value={siteInfo.site_url} 
                      onChange={e => setSiteInfo({...siteInfo, site_url: e.target.value})} 
                      placeholder="https://agro-ncbrasil.lovable.app"
                    />
                  </div>
               </div>
 
               <div className="space-y-4">
                 <Label>Logotipo</Label>
                 <div className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-4 bg-muted/20">
                   {siteInfo.logo_url ? (
                     <img src={siteInfo.logo_url} alt="Logo" className="max-h-24 object-contain" />
                   ) : (
                     <div className="h-24 w-24 rounded bg-muted flex items-center justify-center">
                       <Upload className="h-8 w-8 text-muted-foreground" />
                     </div>
                   )}
                   <Button 
                     variant="outline" 
                     onClick={() => document.getElementById('logo-upload')?.click()}
                     disabled={isUploading}
                   >
                     {isUploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                     Alterar Logo
                   </Button>
                   <input 
                     type="file" 
                     id="logo-upload" 
                     className="hidden" 
                     accept="image/*" 
                     onChange={handleLogoUpload}
                   />
                 </div>
               </div>
             </div>
             <Button 
               className="bg-gold text-emerald-deep font-bold" 
               onClick={() => handleSave("site_info", siteInfo)}
               disabled={isSaving}
             >
               {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
               Salvar Alterações
             </Button>
           </CardContent>
         </Card>
       </TabsContent>
 
       <TabsContent value="visual">
         <Card>
           <CardHeader>
             <CardTitle>Paleta de Cores</CardTitle>
             <CardDescription>Personalize a identidade visual do site</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6 mb-8 p-6 bg-gold/5 rounded-2xl border border-gold/20">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-gold">
                    <Wand2 className="h-5 w-5" /> Gerador de Temas
                  </h3>
                  <p className="text-sm text-muted-foreground">Escolha uma cor base e geraremos uma paleta completa para você.</p>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <ColorPicker label="Cor Base" value={baseColor} onChange={setBaseColor} />
                    </div>
                    <Button onClick={generatePalette} className="bg-gold text-emerald-deep font-bold">Gerar</Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-gold">
                    <History className="h-5 w-5" /> Paletas Salvas ({savedPalettes.length}/5)
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {savedPalettes.map((p, i) => (
                      <div key={i} className="group relative">
                        <button 
                          className="w-full aspect-square rounded-lg border shadow-sm transition-transform hover:scale-105 overflow-hidden"
                          onClick={() => setTheme(p)}
                          title="Clique para carregar esta paleta"
                        >
                          <div className="w-full h-1/2" style={{ backgroundColor: p.primary_color }} />
                          <div className="w-full h-1/2" style={{ backgroundColor: p.secondary_color }} />
                        </button>
                        <button 
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={(e) => { e.stopPropagation(); deletePalette(i); }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {savedPalettes.length < 5 && (
                      <button 
                        onClick={savePalette}
                        className="w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors"
                        title="Salvar paleta atual"
                      >
                        <Save className="h-4 w-4" />
                        <span className="text-[8px] mt-1 uppercase font-bold">Salvar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

             <div className="space-y-8">
               <section className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Cores Principais</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ColorPicker label="Cor Primária (Destaques)" value={theme.primary_color} onChange={v => setTheme({...theme, primary_color: v})} />
                    <ColorPicker label="Texto sobre Primária" value={theme.primary_foreground_color} onChange={v => setTheme({...theme, primary_foreground_color: v})} />
                    <ColorPicker label="Cor Secundária (Nav/Footer)" value={theme.secondary_color} onChange={v => setTheme({...theme, secondary_color: v})} />
                    <ColorPicker label="Texto sobre Secundária" value={theme.secondary_foreground_color} onChange={v => setTheme({...theme, secondary_foreground_color: v})} />
                    <ColorPicker label="Fundo Geral" value={theme.background_color} onChange={v => setTheme({...theme, background_color: v})} />
                    <ColorPicker label="Texto Principal" value={theme.foreground_color} onChange={v => setTheme({...theme, foreground_color: v})} />
                    <ColorPicker label="Texto Secundário" value={theme.muted_foreground_color} onChange={v => setTheme({...theme, muted_foreground_color: v})} />
                    <ColorPicker label="Bordas" value={theme.border_color} onChange={v => setTheme({...theme, border_color: v})} />
                    <ColorPicker label="Inputs" value={theme.input_color} onChange={v => setTheme({...theme, input_color: v})} />
                    <ColorPicker label="Foco (Ring)" value={theme.ring_color} onChange={v => setTheme({...theme, ring_color: v})} />
                  </div>
               </section>

               <section className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Cards e Superfícies</h3>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   <ColorPicker label="Fundo do Card" value={theme.card_color} onChange={v => setTheme({...theme, card_color: v})} />
                   <ColorPicker label="Texto do Card" value={theme.card_foreground_color} onChange={v => setTheme({...theme, card_foreground_color: v})} />
                    <ColorPicker label="Fundo de Menus (Popover)" value={theme.popover_color} onChange={v => setTheme({...theme, popover_color: v})} />
                    <ColorPicker label="Texto de Menus" value={theme.popover_foreground_color} onChange={v => setTheme({...theme, popover_foreground_color: v})} />
                   <ColorPicker label="Fundo Muted" value={theme.muted_color} onChange={v => setTheme({...theme, muted_color: v})} />
                 </div>
               </section>

               <section className="space-y-4">
                 <h3 className="text-lg font-semibold border-b pb-2">Estados e Status</h3>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   <ColorPicker label="Sucesso / Sotaque" value={theme.accent_color} onChange={v => setTheme({...theme, accent_color: v})} />
                    <ColorPicker label="Texto sobre Sucesso" value={theme.accent_foreground_color} onChange={v => setTheme({...theme, accent_foreground_color: v})} />
                   <ColorPicker label="Erro / Destrutivo" value={theme.destructive_color} onChange={v => setTheme({...theme, destructive_color: v})} />
                    <ColorPicker label="Texto sobre Erro" value={theme.destructive_foreground_color} onChange={v => setTheme({...theme, destructive_foreground_color: v})} />
                   <ColorPicker label="Status: AO VIVO" value={theme.live_color} onChange={v => setTheme({...theme, live_color: v})} />
                   <ColorPicker label="Status: EM BREVE" value={theme.upcoming_color} onChange={v => setTheme({...theme, upcoming_color: v})} />
                   <ColorPicker label="Status: ENCERRADO" value={theme.closed_color} onChange={v => setTheme({...theme, closed_color: v})} />
                 </div>
               </section>

               <section className="space-y-4 pt-8 border-t">
                 <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-gold">
                   <Zap className="h-5 w-5" /> Animações e Efeitos Visuais
                 </h3>
                 <div className="grid sm:grid-cols-2 gap-6">
                   <div className="space-y-4 border rounded-xl p-4 bg-muted/5">
                     <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Componentes</h4>
                     <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                         <Label>Blinks em Badges</Label>
                         <p className="text-[10px] text-muted-foreground">Faz com que os balões informativos sobre as fotos pisquem.</p>
                       </div>
                       <Switch 
                         checked={animations.badge_blink} 
                         onCheckedChange={v => setAnimations({...animations, badge_blink: v})} 
                       />
                     </div>
                     <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                         <Label>Brilho (Glow) em Badges</Label>
                         <p className="text-[10px] text-muted-foreground">Adiciona um efeito de luz neon ao redor dos balões.</p>
                       </div>
                       <Switch 
                         checked={animations.badge_glow} 
                         onCheckedChange={v => setAnimations({...animations, badge_glow: v})} 
                       />
                     </div>
                     <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                         <Label>Pulsação no Botão de Lance</Label>
                         <p className="text-[10px] text-muted-foreground">O botão "Dar Lance" pulsa levemente para atrair atenção.</p>
                       </div>
                       <Switch 
                         checked={animations.bid_button_pulse} 
                         onCheckedChange={v => setAnimations({...animations, bid_button_pulse: v})} 
                       />
                     </div>
                   </div>

                   <div className="space-y-4 border rounded-xl p-4 bg-muted/5">
                     <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Transições</h4>
                     <div className="space-y-2">
                       <Label>Efeito de Entrada do Nome do Animal</Label>
                       <select 
                         className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                         value={animations.animal_name_entry}
                         onChange={e => setAnimations({...animations, animal_name_entry: e.target.value})}
                       >
                         <option value="none">Nenhum</option>
                         <option value="slide-up">Deslizar para Cima</option>
                         <option value="fade">Fade In</option>
                         <option value="scale">Aumentar Escala</option>
                       </select>
                     </div>
                     <div className="flex items-center justify-between pt-2">
                       <div className="space-y-0.5">
                         <Label>Tilt no Hover dos Cards</Label>
                         <p className="text-[10px] text-muted-foreground">Inclinação leve dos cards ao passar o mouse.</p>
                       </div>
                       <Switch 
                         checked={animations.card_hover_tilt} 
                         onCheckedChange={v => setAnimations({...animations, card_hover_tilt: v})} 
                       />
                     </div>
                   </div>
                 </div>
                 <Button 
                    className="w-full bg-gold text-emerald-deep font-bold mt-2" 
                    onClick={() => handleSave("animations", animations)}
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Salvar Preferências de Animação
                  </Button>
               </section>
             </div>
 
             <div className="p-6 rounded-xl border bg-muted/10 space-y-4">
               <Label>Visualização em Tempo Real</Label>
               <div className="flex flex-wrap gap-4">
                 <div className="px-4 py-2 rounded-lg font-bold" style={{ backgroundColor: theme.primary_color, color: theme.secondary_color }}>Botão Destaque</div>
                 <div className="px-4 py-2 rounded-lg font-bold text-white" style={{ backgroundColor: theme.secondary_color }}>Fundo Padrão</div>
                 <div className="px-4 py-2 rounded-lg font-bold text-white" style={{ backgroundColor: theme.accent_color }}>Status Sucesso</div>
               </div>
             </div>
 
             <Button 
               className="bg-gold text-emerald-deep font-bold" 
               onClick={() => handleSave("theme", theme)}
               disabled={isSaving}
             >
               {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
               Salvar Paleta
             </Button>
           </CardContent>
         </Card>
       </TabsContent>
 
       <TabsContent value="homepage">
         <Card>
           <CardHeader>
             <CardTitle>Controle da Página Inicial</CardTitle>
             <CardDescription>Ative seções e defina a ordem de exibição</CardDescription>
           </CardHeader>
           <CardContent className="space-y-8">
             <div className="grid sm:grid-cols-2 gap-6">
               <div className="space-y-4 border rounded-xl p-4">
                 <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Visibilidade</h4>
                 <div className="flex items-center justify-between">
                   <Label htmlFor="show_animated">Slides / Cards Animados</Label>
                   <Switch 
                     id="show_animated" 
                     checked={homepage.show_animated_slides} 
                     onCheckedChange={v => setHomepage({...homepage, show_animated_slides: v})} 
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <Label htmlFor="show_events">Próximos Eventos</Label>
                   <Switch 
                     id="show_events" 
                     checked={homepage.show_upcoming_events} 
                     onCheckedChange={v => setHomepage({...homepage, show_upcoming_events: v})} 
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <Label htmlFor="show_featured">Lotes em Destaque</Label>
                   <Switch 
                     id="show_featured" 
                     checked={homepage.show_featured_lots} 
                     onCheckedChange={v => setHomepage({...homepage, show_featured_lots: v})} 
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <Label htmlFor="show_sale">Menu de Vendas</Label>
                   <Switch 
                     id="show_sale" 
                     checked={homepage.show_sale_menu} 
                     onCheckedChange={v => setHomepage({...homepage, show_sale_menu: v})} 
                   />
                 </div>
                 <div className="flex items-center justify-between">
                   <Label htmlFor="show_articles">Artigos / Blog</Label>
                   <Switch 
                     id="show_articles" 
                     checked={homepage.show_articles} 
                     onCheckedChange={v => setHomepage({...homepage, show_articles: v})} 
                   />
                 </div>
                  <div className="flex items-center justify-between pt-4 border-t border-dashed">
                    <div className="space-y-0.5">
                      <Label htmlFor="mobile_mode" className="text-gold font-bold">Modo Mobile Nativo (PWA)</Label>
                      <p className="text-[10px] text-muted-foreground">Otimiza a interface para parecer um aplicativo móvel instalado.</p>
                    </div>
                    <Switch 
                      id="mobile_mode" 
                      checked={homepage.mobile_mode_enabled} 
                      onCheckedChange={v => setHomepage({...homepage, mobile_mode_enabled: v})} 
                    />
                  </div>
               </div>
 
               <div className="space-y-4 border rounded-xl p-4">
                 <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Ordem das Seções</h4>
                 <div className="space-y-2">
                    {homepage.order.map((section: string, idx: number) => (
                     <div key={section} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                       <span className="text-sm font-medium">{sectionLabels[section] || section}</span>
                       <div className="flex gap-1">
                         <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveSection(idx, 'up')} disabled={idx === 0}>
                           <ArrowUp className="h-4 w-4" />
                         </Button>
                         <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveSection(idx, 'down')} disabled={idx === homepage.order.length - 1}>
                           <ArrowDown className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
 
             <Button 
               className="bg-gold text-emerald-deep font-bold" 
               onClick={() => handleSave("homepage_sections", homepage)}
               disabled={isSaving}
             >
               {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
               Salvar Configuração de Página
             </Button>
           </CardContent>
         </Card>
        </TabsContent>

        <TabsContent value="seo">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-gold" /> Configurações Globais de SEO
                </CardTitle>
                <CardDescription>Defina os padrões de SEO para todo o site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_suffix">Sufixo de Título (Global)</Label>
                    <Input 
                      id="seo_suffix" 
                      value={seoSettings.global_title_suffix} 
                      onChange={e => setSeoSettings({...seoSettings, global_title_suffix: e.target.value})} 
                      placeholder="Ex: | Minha Empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_description_global">Meta Descrição Padrão</Label>
                    <Input 
                      id="seo_description_global" 
                      value={seoSettings.global_description} 
                      onChange={e => setSeoSettings({...seoSettings, global_description: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="ga_id">Google Analytics ID</Label>
                    <Input 
                      id="ga_id" 
                      value={seoSettings.google_analytics_id} 
                      onChange={e => setSeoSettings({...seoSettings, google_analytics_id: e.target.value})} 
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fb_id">Facebook Pixel ID</Label>
                    <Input 
                      id="fb_id" 
                      value={seoSettings.facebook_pixel_id} 
                      onChange={e => setSeoSettings({...seoSettings, facebook_pixel_id: e.target.value})} 
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="twitter_handle">Twitter Handle (Usuario X)</Label>
                    <Input 
                      id="twitter_handle" 
                      value={seoSettings.twitter_handle} 
                      onChange={e => setSeoSettings({...seoSettings, twitter_handle: e.target.value})} 
                      placeholder="@usuario"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="og_image_default">Imagem Padrão de Compartilhamento (OG Image)</Label>
                    <Input 
                      id="og_image_default" 
                      value={seoSettings.og_default_image} 
                      onChange={e => setSeoSettings({...seoSettings, og_default_image: e.target.value})} 
                      placeholder="URL da imagem padrão"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-gold" /> SEO por Página
                </CardTitle>
                <CardDescription>Personalize títulos e descrições de páginas específicas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-xl bg-muted/5">
                  <h4 className="font-bold border-b pb-2">Página Inicial (Home)</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título Customizado</Label>
                      <Input 
                        value={seoSettings.home_title} 
                        onChange={e => setSeoSettings({...seoSettings, home_title: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição Customizada</Label>
                      <Input 
                        value={seoSettings.home_description} 
                        onChange={e => setSeoSettings({...seoSettings, home_description: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-dashed">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gold/60">OG Título (Social)</Label>
                      <Input 
                        className="h-8 text-xs"
                        value={seoSettings.home_og_title} 
                        onChange={e => setSeoSettings({...seoSettings, home_og_title: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gold/60">OG Descrição (Social)</Label>
                      <Input 
                        className="h-8 text-xs"
                        value={seoSettings.home_og_description} 
                        onChange={e => setSeoSettings({...seoSettings, home_og_description: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gold/60">OG Imagem (URL)</Label>
                      <Input 
                        className="h-8 text-xs"
                        value={seoSettings.home_og_image} 
                        onChange={e => setSeoSettings({...seoSettings, home_og_image: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-xl bg-muted/5">
                  <h4 className="font-bold border-b pb-2">Página Sobre</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Título Customizado</Label>
                      <Input 
                        value={seoSettings.about_title} 
                        onChange={e => setSeoSettings({...seoSettings, about_title: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição Customizada</Label>
                      <Input 
                        value={seoSettings.about_description} 
                        onChange={e => setSeoSettings({...seoSettings, about_description: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-dashed">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gold/60">OG Título (Social)</Label>
                      <Input 
                        className="h-8 text-xs"
                        value={seoSettings.about_og_title} 
                        onChange={e => setSeoSettings({...seoSettings, about_og_title: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gold/60">OG Descrição (Social)</Label>
                      <Input 
                        className="h-8 text-xs"
                        value={seoSettings.about_og_description} 
                        onChange={e => setSeoSettings({...seoSettings, about_og_description: e.target.value})} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gold/60">OG Imagem (URL)</Label>
                      <Input 
                        className="h-8 text-xs"
                        value={seoSettings.about_og_image} 
                        onChange={e => setSeoSettings({...seoSettings, about_og_image: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gold text-emerald-deep font-bold" 
                  onClick={() => handleSave("seo_settings", seoSettings)}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar Configurações de SEO
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-gold" /> Indexação e Sitemap
                </CardTitle>
                <CardDescription>Status dos arquivos de rastreamento para buscadores</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-xl bg-muted/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold">Sitemap Automático</h4>
                    <p className="text-sm text-muted-foreground">Gerado dinamicamente com todos os eventos e notícias.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold uppercase">Ativo</span>
                  </div>
                </div>
                <div className="p-4 border rounded-xl bg-muted/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-bold">Robots.txt</h4>
                    <p className="text-sm text-muted-foreground">Configurado para permitir rastreamento global.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold uppercase">Ativo</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <BulkSeoAudit />
        </TabsContent>

        <TabsContent value="lots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-gold" /> Configuração do Card do Lote
              </CardTitle>
              <CardDescription>Personalize como as informações dos animais aparecem nos cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-bold">Modo de Exibição de Mídia</Label>
                <div className="flex gap-4">
                  <Button 
                    variant={lotCardSettings.media_mode === 'gallery' ? 'default' : 'outline'}
                    onClick={() => setLotCardSettings({...lotCardSettings, media_mode: 'gallery'})}
                    className="flex-1"
                  >
                    Galeria de Fotos
                  </Button>
                  <Button 
                    variant={lotCardSettings.media_mode === 'video' ? 'default' : 'outline'}
                    onClick={() => setLotCardSettings({...lotCardSettings, media_mode: 'video'})}
                    className="flex-1"
                  >
                    Vídeo do Animal
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  {lotCardSettings.media_mode === 'gallery' 
                    ? "Mostra um carrossel com as fotos do animal no card." 
                    : "Tenta exibir o vídeo do YouTube se disponível, caso contrário volta para a foto principal."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 border-t pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold">Campos de Informação</Label>
                    <span className="text-xs text-muted-foreground uppercase font-black">Exibir / Reordenar</span>
                  </div>
                  
                  <div className="grid gap-2">
                    {lotCardSettings.displayed_fields.map((field, idx) => (
                      <div key={field.key} className="flex items-center gap-3 p-3 bg-muted/20 border rounded-xl group">
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 p-0 hover:bg-gold/10 hover:text-gold"
                            onClick={() => {
                              if (idx === 0) return;
                              const newFields = [...lotCardSettings.displayed_fields];
                              [newFields[idx-1], newFields[idx]] = [newFields[idx], newFields[idx-1]];
                              setLotCardSettings({...lotCardSettings, displayed_fields: newFields});
                            }}
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 p-0 hover:bg-gold/10 hover:text-gold"
                            onClick={() => {
                              if (idx === lotCardSettings.displayed_fields.length - 1) return;
                              const newFields = [...lotCardSettings.displayed_fields];
                              [newFields[idx+1], newFields[idx]] = [newFields[idx], newFields[idx+1]];
                              setLotCardSettings({...lotCardSettings, displayed_fields: newFields});
                            }}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex-1">
                          <span className="text-sm font-bold uppercase tracking-tight">{field.label}</span>
                        </div>

                        <Switch 
                          checked={field.enabled} 
                          onCheckedChange={(checked) => {
                            const newFields = [...lotCardSettings.displayed_fields];
                            newFields[idx] = { ...newFields[idx], enabled: checked };
                            setLotCardSettings({...lotCardSettings, displayed_fields: newFields});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                 <div className="space-y-8">
                   <div className="space-y-4">
                     <Label className="text-base font-bold">Pré-visualização do Card</Label>
                     <div className="p-4 bg-muted/5 rounded-3xl border border-dashed border-gold/20 flex justify-center">
                       <div className="w-full max-w-[320px] pointer-events-none scale-90 sm:scale-100 origin-top">
                         <LotCard 
                           lot={{
                             id: "preview-1",
                             number: 1,
                             name: "Animal de Exemplo",
                             breed: "Raça Premium",
                             category: "Equino",
                             cover: "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80",
                             currentBid: 50000,
                             minIncrement: 1000,
                             bidsCount: 12,
                             viewers: 154,
                             status: "open",
                             father: "Pai de Elite",
                             mother: "Matriz de Ouro",
                             sex: "M",
                             registration_number: "ABC-123",
                             seller: "Haras Exemplo",
                             location: "São Paulo - SP",
                             photos: ["https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80"]
                           } as any}
                           settings={lotCardSettings}
                         />
                       </div>
                     </div>
                     <p className="text-[10px] text-center text-muted-foreground uppercase italic">Esta é uma prévia de como o card aparecerá para os usuários</p>
                   </div>
 
                   <div className="space-y-4 border-t pt-6">
                     <Label className="text-base font-bold">Efeitos e Animações</Label>
                     
                     <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border">
                      <div className="space-y-1">
                        <span className="text-sm font-bold uppercase">Piscar Badges</span>
                        <p className="text-[10px] text-muted-foreground uppercase">Efeito de pulso em 'AO VIVO' e 'URGENTE'</p>
                      </div>
                      <Switch 
                        checked={animations.badge_blink} 
                        onCheckedChange={v => setAnimations({...animations, badge_blink: v})} 
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border">
                      <div className="space-y-1">
                        <span className="text-sm font-bold uppercase">Brilho (Glow)</span>
                        <p className="text-[10px] text-muted-foreground uppercase">Efeito neon nos cards e badges</p>
                      </div>
                      <Switch 
                        checked={animations.badge_glow} 
                        onCheckedChange={v => setAnimations({...animations, badge_glow: v})} 
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Efeito de Entrada do Nome</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {['none', 'fade', 'slide-up'].map((effect) => (
                          <Button
                            key={effect}
                            variant={animations.animal_name_entry === effect ? 'default' : 'outline'}
                            className="text-[10px] font-black uppercase"
                            onClick={() => setAnimations({...animations, animal_name_entry: effect})}
                          >
                            {effect === 'slide-up' ? 'Deslizar' : effect === 'fade' ? 'Fade' : 'Nenhum'}
                          </Button>
                        ))}
                      </div>
                    </div>
                     </div>
                   </div>
                 </div>
               </div>
 
               <div className="pt-6 border-t flex justify-end">
                <Button 
                  className="bg-gold text-emerald-deep font-black hover:bg-gold/90 shadow-gold"
                  disabled={isSaving}
                  onClick={() => {
                    handleSave("lot_card_settings", lotCardSettings);
                    handleSave("animations", animations);
                  }}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  SALVAR TUDO
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  }