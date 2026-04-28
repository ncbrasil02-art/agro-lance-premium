 import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Link } from "@tanstack/react-router";
import { Gavel, Instagram, Youtube, Facebook } from "lucide-react";

 export function Footer() {
   const { siteInfo } = useSiteSettings();
   const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-gradient">
              <Gavel className="h-5 w-5 text-emerald-deep" />
            </span>
            {siteInfo?.logo_url ? (
              <img src={siteInfo.logo_url} alt={siteInfo.name} className="h-8 object-contain" />
            ) : (
              <span>
                <span className="text-foreground">{siteInfo?.name.split(' ')[0] || "Premium"}</span>
                <span className="text-gradient-gold">{siteInfo?.name.split(' ').slice(1).join(' ') || "Agro"}</span>
              </span>
            )}
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">
            A plataforma premium de leilões agropecuários do Brasil.
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
            <li><Link to="/sobre" className="hover:text-foreground">Sobre</Link></li>
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
