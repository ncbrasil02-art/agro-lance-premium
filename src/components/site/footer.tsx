  import { useSiteSettings } from "@/hooks/useSiteSettings";
  import { useState } from "react";
  import { toast } from "sonner";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { Send } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Gavel, Instagram, Youtube, Facebook } from "lucide-react";

 export function Footer() {
    const { siteInfo, customTexts, aboutPage } = useSiteSettings();
   const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/60 bg-card/40">
       <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-5">
         <div className="md:col-span-1">
           <h4 className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold/60">Newsletter</h4>
           <p className="text-xs text-muted-foreground mb-4 italic">Receba novidades e próximos leilões em seu e-mail.</p>
           <NewsletterForm />
         </div>
         <div>

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
           className="bg-white/5 border-white/10 text-xs h-10 pr-10"
           value={email}
           onChange={e => setEmail(e.target.value)}
           required
         />
         <button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 text-gold">
           <Send className="h-4 w-4" />
         </button>
       </div>
     </form>
   );
 }
          <Link to="/" className="flex items-center gap-2 font-bold">
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
           <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
             {customTexts?.footer_text || "A plataforma premium de leilões agropecuários do Brasil."}
           </p>
          <div className="mt-4 flex gap-2">
            {[Instagram, Youtube, Facebook].map((Icon, i) => (
              <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-smooth hover:bg-gold-gradient hover:text-emerald-deep" aria-label="Rede social">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Plataforma</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/eventos" className="hover:text-foreground">Eventos</Link></li>
            <li><Link to="/lotes" className="hover:text-foreground">Lotes</Link></li>
            <li><Link to="/ao-vivo" className="hover:text-foreground">Ao Vivo</Link></li>
             {aboutPage?.enabled !== false && (
               <li><Link to="/sobre" className="hover:text-foreground">{aboutPage?.title || "Sobre"}</Link></li>
             )}
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Conta</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/login" className="hover:text-foreground">Entrar</Link></li>
            <li><Link to="/cadastro" className="hover:text-foreground">Cadastre-se</Link></li>
            <li><a href="#" className="hover:text-foreground">Como participar</a></li>
            <li><a href="#" className="hover:text-foreground">Regulamento</a></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Contato</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>{siteInfo?.email || "contato@premiumagro.com.br"}</li>
            <li>{siteInfo?.phone || "+55 11 4002-8922"}</li>
            <li>Av. Paulista, 1000 — São Paulo/SP</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row">
          <span>© {year} {siteInfo?.name || "Premium Agro Leilões"}. Todos os direitos reservados.</span>
          <span>CNPJ {siteInfo?.cnpj || "00.000.000/0001-00"} · Leiloeiro JUCESP nº 000</span>
        </div>
      </div>
    </footer>
  );
}
