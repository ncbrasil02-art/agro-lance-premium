 import { useSiteSettings } from "@/hooks/useSiteSettings";
 import { Link } from "@tanstack/react-router";
 import { Gavel, Instagram, Youtube, Facebook, Send } from "lucide-react";
 import { useState } from "react";
 import { toast } from "sonner";
 import { Input } from "@/components/ui/input";
 
 function NewsletterForm() {
   const [email, setEmail] = useState("");
   const [isLoading, setIsLoading] = useState(false);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     if (!email) return;
     setIsLoading(true);
     await new Promise(resolve => setTimeout(resolve, 800));
     toast.success("Inscrição realizada com sucesso!");
     setEmail("");
     setIsLoading(false);
   };
 
   return (
     <form onSubmit={handleSubmit} className="space-y-2">
       <div className="relative">
         <Input 
           type="email" 
           placeholder="Seu e-mail" 
           className="bg-white/5 border-white/10 text-xs h-10 pr-10 focus:ring-gold"
           value={email}
           onChange={e => setEmail(e.target.value)}
           required
         />
         <button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 text-gold hover:text-white transition-colors">
           <Send className="h-4 w-4" />
         </button>
       </div>
     </form>
   );
 }
 
 export function Footer() {
   const { siteInfo, customTexts, aboutPage } = useSiteSettings();
   const year = new Date().getFullYear();
 
   return (
     <footer className="border-t border-border/60 bg-card/40">
       <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-5">
         <div className="md:col-span-1">
           <Link to="/" className="flex items-center gap-2 font-bold mb-4">
             <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient">
               <Gavel className="h-5 w-5 text-emerald-deep" />
             </span>
             {siteInfo?.logo_url ? (
               <img src={siteInfo.logo_url} alt={siteInfo.name} className="h-8 object-contain" />
             ) : (
               <span>
                 <span className="text-foreground">{siteInfo?.name?.split(' ')?.[0] || "Premium"}</span>
                 <span className="text-gradient-gold">{siteInfo?.name?.split(' ')?.slice(1)?.join(' ') || "Agro"}</span>
               </span>
             )}
           </Link>
           <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
             {customTexts?.footer_text || "A plataforma premium de leilões agropecuários do Brasil."}
           </p>
           <div className="mt-6 flex gap-2">
             {[Instagram, Youtube, Facebook].map((Icon, i) => (
               <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-smooth hover:bg-gold-gradient hover:text-emerald-deep" aria-label="Rede social">
                 <Icon className="h-4 w-4" />
               </a>
             ))}
           </div>
         </div>
 
         <div>
           <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-gold/60">Plataforma</h4>
           <ul className="space-y-2 text-sm text-muted-foreground">
             <li><Link to="/eventos" className="hover:text-foreground transition-colors">Eventos</Link></li>
             <li><Link to="/lotes" className="hover:text-foreground transition-colors">Lotes</Link></li>
             <li><Link to="/ao-vivo" className="hover:text-foreground transition-colors">Ao Vivo</Link></li>
             {aboutPage?.enabled !== false && (
               <li><Link to="/sobre" className="hover:text-foreground transition-colors">{aboutPage?.title || "Sobre"}</Link></li>
             )}
           </ul>
         </div>
 
         <div>
           <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-gold/60">Conta</h4>
           <ul className="space-y-2 text-sm text-muted-foreground">
             <li><Link to="/login" className="hover:text-foreground transition-colors">Entrar</Link></li>
             <li><Link to="/cadastro" className="hover:text-foreground transition-colors">Cadastre-se</Link></li>
             <li><a href="#" className="hover:text-foreground transition-colors">Como participar</a></li>
             <li><a href="#" className="hover:text-foreground transition-colors">Regulamento</a></li>
           </ul>
         </div>
 
         <div>
           <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-gold/60">Contato</h4>
           <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="break-all">{siteInfo?.email || "contato@ncbrasil.com.br"}</li>
              <li>{siteInfo?.phone || "(21) 99650-9905"}</li>
              <li>Brasil</li>
           </ul>
         </div>
 
         <div>
           <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-gold/60">Newsletter</h4>
           <p className="text-xs text-muted-foreground mb-4 italic">Receba as melhores oportunidades em seu e-mail.</p>
           <NewsletterForm />
         </div>
       </div>
 
       <div className="border-t border-border/60">
         <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground md:flex-row">
           <span>© {new Date().getFullYear()} {siteInfo?.name || "Premium Agro Leilões"}. Todos os direitos reservados.</span>
           <span>CNPJ {siteInfo?.cnpj || "00.000.000/0001-00"} · Leiloeiro JUCESP nº 000</span>
         </div>
       </div>
     </footer>
   );
 }
