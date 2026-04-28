 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { Switch } from "@/components/ui/switch";
 import { toast } from "sonner";
  import { Loader2, Save, Upload, Palette, Home, Info, ArrowUp, ArrowDown, Wand2, History, Trash2, Check } from "lucide-react";
 
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
 
 export function SiteSettings() {
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   const [isUploading, setIsUploading] = useState(false);
    const [baseColor, setBaseColor] = useState("#D4AF37");
    const [savedPalettes, setSavedPalettes] = useState<any[]>([]);
 
   const [siteInfo, setSiteInfo] = useState({
     name: "",
     email: "",
     phone: "",
     cnpj: "",
     logo_url: ""
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
 
   const [homepage, setHomepage] = useState({
     show_articles: true,
     show_upcoming_events: true,
     show_featured_lots: true,
     show_sale_menu: true,
     show_animated_slides: true,
     order: ["banners", "upcoming_events", "featured_lots", "sale_menu", "articles"]
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
        const palettes = data.find(i => i.key === "saved_palettes")?.value;

        if (info) setSiteInfo((prev: any) => ({ ...prev, ...(info as any) }));
        if (themeData) setTheme((prev: any) => ({ ...prev, ...(themeData as any) }));
        if (homeData) setHomepage((prev: any) => ({ ...prev, ...(homeData as any) }));
        if (palettes && Array.isArray(palettes)) setSavedPalettes(palettes);

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
     if (!file) return;
 
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
 
   const moveSection = (index: number, direction: 'up' | 'down') => {
     const newOrder = [...homepage.order];
     const newIndex = direction === 'up' ? index - 1 : index + 1;
     
     if (newIndex < 0 || newIndex >= newOrder.length) return;
     
     const temp = newOrder[index];
     newOrder[index] = newOrder[newIndex];
     newOrder[newIndex] = temp;
     
     setHomepage(prev => ({ ...prev, order: newOrder }));
   };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center p-12">
         <Loader2 className="h-8 w-8 animate-spin text-gold" />
       </div>
     );
   }
 
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
     <Tabs defaultValue="geral" className="space-y-6">
       <TabsList className="bg-muted/50 p-1">
         <TabsTrigger value="geral" className="gap-2">
           <Info className="h-4 w-4" /> Geral
         </TabsTrigger>
         <TabsTrigger value="visual" className="gap-2">
           <Palette className="h-4 w-4" /> Visual
         </TabsTrigger>
         <TabsTrigger value="homepage" className="gap-2">
           <Home className="h-4 w-4" /> Página Inicial
         </TabsTrigger>
       </TabsList>
 
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
               </div>
 
               <div className="space-y-4 border rounded-xl p-4">
                 <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Ordem das Seções</h4>
                 <div className="space-y-2">
                   {homepage.order.map((section, idx) => (
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
     </Tabs>
   );
 }