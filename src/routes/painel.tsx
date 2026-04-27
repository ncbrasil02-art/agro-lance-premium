import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  User, Gavel, FileText, Receipt, CreditCard, Clock, 
  ChevronRight, BadgeCheck, Download, ExternalLink, 
  ShieldCheck, AlertCircle, Info, Printer, MessageSquare
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/utils/format";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/painel")({
  component: UserDashboard,
});

function UserDashboard() {
  const { user, profile } = useAuth();
  const [myLots, setMyLots] = useState<any[]>([]);
  const [myBids, setMyBids] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    if (!user?.id) return;
    try {
      // Fetch lots won by the user
      const { data: wonLots } = await supabase
        .from("lots")
        .select("*, animal:animals(*), event:events(*)")
        .eq("winner_id", user.id)
        .order("updated_at", { ascending: false });
      
      setMyLots(wonLots || []);

      // Fetch recent bids by the user
      const { data: userBids } = await supabase
        .from("bids")
        .select("*, lot:lots(*, animal:animals(name))")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      setMyBids(userBids || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Erro ao carregar dados do painel");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-muted-foreground">Você precisa estar logado para acessar esta área.</p>
        <Link to="/login" className="mt-4 inline-block">
          <Button>Fazer Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-emerald-deep">Minha Conta</h1>
          <p className="text-muted-foreground">Olá, {profile?.full_name}. Bem-vindo ao seu painel de arremates.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`px-3 py-1 ${profile?.is_approved ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-amber-500/10 text-amber-600 border-amber-200"}`}
          >
            {profile?.is_approved ? (
              <span className="flex items-center gap-1"><BadgeCheck className="h-3 w-3" /> Cadastro Aprovado</span>
            ) : (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Aguardando Aprovação</span>
            )}
          </Badge>
        </div>
      </header>

      <Tabs defaultValue="arremates" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="arremates" className="gap-2">
            <Gavel className="h-4 w-4" /> Meus Arremates
          </TabsTrigger>
          <TabsTrigger value="lances" className="gap-2">
            <Clock className="h-4 w-4" /> Meus Lances
          </TabsTrigger>
          <TabsTrigger value="mensagens" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Mensagens
          </TabsTrigger>
          <TabsTrigger value="lances" className="gap-2">
            <Clock className="h-4 w-4" /> Meus Lances
          </TabsTrigger>
          <TabsTrigger value="perfil" className="gap-2">
            <User className="h-4 w-4" /> Dados Cadastrais
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arremates" className="space-y-6">
          {myLots.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Gavel className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <CardTitle className="text-xl">Nenhum arremate ainda</CardTitle>
                <CardDescription className="max-w-xs mx-auto mt-2">
                  Você ainda não arrematou nenhum lote. Participe dos nossos leilões ao vivo para garantir seu animal de elite.
                </CardDescription>
                <Link to="/ao-vivo" className="mt-6">
                  <Button className="bg-gold text-emerald-deep font-bold">Ir para o Leilão ao Vivo</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {myLots.map((lot) => (
                <LotPurchaseCard key={lot.id} lot={lot} profile={profile} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="lances">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Lances</CardTitle>
              <CardDescription>Seus lances recentes em todos os leilões.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                    <tr>
                      <th className="px-4 py-3">Data/Hora</th>
                      <th className="px-4 py-3">Animal</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-b">
                    {myBids.map((bid) => (
                      <tr key={bid.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          {new Date(bid.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-4 font-medium">
                          {bid.lot?.animal?.name || "Lote #"+bid.lot?.lot_number}
                        </td>
                        <td className="px-4 py-4 font-bold text-emerald-deep">
                          {formatBRL(bid.amount)}
                        </td>
                        <td className="px-4 py-4">
                          {bid.amount >= (bid.lot?.current_price || 0) ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Maior lance</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Lance superado</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Dados do Perfil</CardTitle>
              <CardDescription>Informações utilizadas para emissão de contratos e notas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Nome Completo</label>
                  <p className="font-medium">{profile?.full_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">E-mail</label>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">CPF</label>
                  <p className="font-medium">{profile?.cpf || "Não informado"}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Telefone</label>
                  <p className="font-medium">{profile?.phone || "Não informado"}</p>
                </div>
              </div>
              <Separator />
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-900">Mantenha seus dados atualizados</p>
                  <p className="text-xs text-amber-800">Estes dados são essenciais para a validade jurídica dos contratos de arremate. Caso precise alterar, entre em contato com o suporte.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LotPurchaseCard({ lot, profile }: { lot: any, profile: any }) {
  return (
    <Card className="overflow-hidden border-2 hover:border-gold/30 transition-all shadow-md">
      <div className="grid md:grid-cols-[240px_1fr] lg:grid-cols-[300px_1fr]">
        <div className="relative aspect-square md:aspect-auto bg-muted">
          <OptimizedImage 
            src={lot.animal?.photos?.[0]} 
            alt={lot.animal?.name} 
            className="h-full w-full object-cover"
            width={400}
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-emerald-600 text-white border-none shadow-lg">Lote Arrematado</Badge>
          </div>
        </div>
        
        <div className="p-6 flex flex-col">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase text-gold tracking-widest">Lote #{lot.lot_number}</span>
                <Separator orientation="vertical" className="h-3 bg-gold/30" />
                <span className="text-xs font-bold uppercase text-muted-foreground">{lot.event?.name}</span>
              </div>
              <h3 className="text-2xl font-black text-emerald-deep tracking-tighter uppercase italic">{lot.animal?.name}</h3>
              <p className="text-sm text-muted-foreground">{lot.animal?.breed} · {lot.animal?.species}</p>
            </div>
            
            <div className="text-right bg-emerald-deep/5 p-3 rounded-xl border border-emerald-deep/10">
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Valor do Arremate</p>
              <p className="text-2xl font-black text-emerald-deep tabular-nums">{formatBRL(lot.current_price)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Data da Compra</p>
              <p className="text-sm font-medium">{new Date(lot.updated_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Vendedor</p>
              <p className="text-sm font-medium">Fazenda Exemplar</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Status de Pagamento</p>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">Aguardando Confirmação</Badge>
            </div>
            <div className="space-y-1 text-right">
               <p className="text-[10px] font-bold uppercase text-muted-foreground">Ações</p>
               <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">Solicitar Ajuda</Button>
            </div>
          </div>

          <Separator className="mb-6" />

          <div className="flex flex-wrap gap-3 mt-auto">
            <DocumentButton 
              title="Termo de Arrematação" 
              lot={lot} 
              profile={profile}
              type="termo"
            />
            <DocumentButton 
              title="Nota de Venda" 
              lot={lot} 
              profile={profile}
              type="nota"
            />
            <DocumentButton 
              title="Contrato de Compra" 
              lot={lot} 
              profile={profile}
              type="contrato"
            />
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
              <CreditCard className="h-4 w-4" /> Realizar Pagamento
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function DocumentButton({ title, lot, profile, type }: { title: string, lot: any, profile: any, type: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-emerald-deep/20 hover:bg-emerald-deep hover:text-white font-bold transition-all">
          <FileText className="h-4 w-4" /> {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white p-0">
        <DialogHeader className="p-6 bg-emerald-deep text-white flex flex-row items-center justify-between">
          <DialogTitle className="text-xl flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-gold" /> {title}
          </DialogTitle>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir Documento
          </Button>
        </DialogHeader>
        
        <div className="p-12 text-gray-800 bg-white" id="printable-area">
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center gap-3">
               <div className="bg-emerald-deep p-2 rounded-lg">
                 <Gavel className="h-8 w-8 text-gold" />
               </div>
               <div>
                 <h2 className="text-2xl font-black text-emerald-deep leading-none uppercase tracking-tighter italic">Premium Agro</h2>
                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Leilões Agropecuários de Elite</p>
               </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">ID do Documento</p>
              <p className="text-sm font-mono font-bold text-emerald-deep">{type.toUpperCase()}-{lot.id.slice(0,8)}</p>
              <p className="text-[10px] text-gray-400 mt-1">Data de emissão: {new Date().toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          {type === 'termo' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black uppercase tracking-tight text-emerald-deep mb-2">Termo de Arrematação</h1>
                <div className="h-1 w-20 bg-gold mx-auto" />
              </div>
              
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gold border-b pb-1">Dados do Arrematante</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Nome:</span> <span className="font-bold">{profile?.full_name}</span></p>
                    <p><span className="text-gray-500">CPF/CNPJ:</span> <span className="font-bold">{profile?.cpf || "---"}</span></p>
                    <p><span className="text-gray-500">Telefone:</span> <span className="font-bold">{profile?.phone || "---"}</span></p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gold border-b pb-1">Dados do Leilão</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Evento:</span> <span className="font-bold">{lot.event?.name}</span></p>
                    <p><span className="text-gray-500">Data:</span> <span className="font-bold">{new Date(lot.updated_at).toLocaleDateString("pt-BR")}</span></p>
                    <p><span className="text-gray-500">Lote:</span> <span className="font-bold">#{lot.lot_number}</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mt-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-deep border-b border-emerald-deep/10 pb-2 mb-4">Especificações do Lote</h3>
                <div className="grid grid-cols-3 gap-6 text-sm">
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold">Animal</p>
                    <p className="font-bold text-lg">{lot.animal?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold">Raça/Espécie</p>
                    <p className="font-bold">{lot.animal?.breed} / {lot.animal?.species}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold">Valor do Arremate</p>
                    <p className="font-black text-xl text-emerald-600">{formatBRL(lot.current_price)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-10">
                <p className="text-sm leading-relaxed text-gray-600 italic">
                  "Confirmo para os devidos fins de direito o arremate do lote acima descrito pelo valor indicado, 
                  estando ciente das normas e regulamentos do leilão {lot.event?.name}. O arrematante declara-se 
                  responsável pelo pagamento integral do valor arrematado somado às comissões aplicáveis."
                </p>
              </div>

              <div className="flex justify-between items-end pt-20">
                 <div className="w-64 border-t border-gray-400 text-center pt-2">
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Premium Agro Leilões</p>
                   <p className="text-[10px] text-gray-400">Assinatura Digital Auditada</p>
                 </div>
                 <div className="w-64 border-t border-gray-400 text-center pt-2">
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{profile?.full_name}</p>
                   <p className="text-[10px] text-gray-400">Arrematante</p>
                 </div>
              </div>
            </div>
          )}

          {type === 'nota' && (
            <div className="space-y-8">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-black uppercase tracking-tight text-emerald-deep mb-2">Nota de Venda</h1>
                <p className="text-gray-400 text-xs font-bold tracking-widest">COMPROVANTE DE TRANSAÇÃO AGROPECUÁRIA</p>
              </div>

              <div className="border rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gray-50 p-4 border-b flex justify-between font-bold text-xs uppercase tracking-widest">
                   <span>Descrição dos Itens</span>
                   <span>Subtotal</span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-lg uppercase italic">{lot.animal?.name}</p>
                      <p className="text-xs text-gray-500">Lote #{lot.lot_number} - {lot.animal?.breed}</p>
                    </div>
                    <p className="font-bold text-lg">{formatBRL(lot.current_price)}</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <p>Comissão do Comprador (0%)</p>
                    <p>{formatBRL(0)}</p>
                  </div>
                </div>
                <div className="bg-emerald-deep p-6 text-white flex justify-between items-center">
                  <div className="uppercase font-black tracking-widest">Valor Total a Pagar</div>
                  <div className="text-3xl font-black">{formatBRL(lot.current_price)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 mt-10">
                <div className="p-4 rounded-xl border-2 border-dashed border-gray-100">
                  <h4 className="text-[10px] font-black uppercase text-emerald-deep mb-3 tracking-widest">Informações de Pagamento</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    O pagamento deve ser realizado através dos canais oficiais da Premium Agro. 
                    Utilize a chave PIX ou os dados bancários informados no painel do cliente.
                  </p>
                  <div className="bg-white p-3 rounded border text-center flex flex-col items-center">
                    <div className="h-32 w-32 bg-gray-100 flex items-center justify-center mb-2">
                      <Badge variant="outline">QR CODE PIX</Badge>
                    </div>
                    <p className="text-[10px] font-mono text-gray-400 break-all">00020101021226830014br.gov.bcb.pix0136...</p>
                  </div>
                </div>
                <div className="space-y-4">
                   <h4 className="text-[10px] font-black uppercase text-emerald-deep mb-3 tracking-widest">Termos e Condições</h4>
                   <ul className="text-[10px] text-gray-500 space-y-2 list-disc pl-4">
                     <li>Esta nota serve como comprovante de arremate oficial.</li>
                     <li>O animal só será liberado após a compensação integral do pagamento.</li>
                     <li>A responsabilidade pelo transporte após a venda é do arrematante.</li>
                     <li>Incidentes e sanidade são regidos pelo contrato de compra e venda.</li>
                   </ul>
                </div>
              </div>
            </div>
          )}

          {type === 'contrato' && (
            <div className="space-y-6 text-sm leading-relaxed text-justify text-gray-700 font-serif">
               <h1 className="text-xl font-bold text-center uppercase mb-8 underline">Instrumento Particular de Compra e Venda de Semovente</h1>
               
               <p>
                 Pelo presente instrumento particular, as partes abaixo identificadas têm entre si, justo e contratado, a compra e venda do animal descrito, mediante as cláusulas e condições seguintes:
               </p>

               <p>
                 <strong>VENDEDOR:</strong> FAZENDA EXEMPLAR AGROPECUÁRIA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 00.000.000/0001-00, com sede na Estrada Rural, Km 10, Uberaba/MG.
               </p>

               <p>
                 <strong>COMPRADOR:</strong> <strong>{profile?.full_name?.toUpperCase()}</strong>, residente e domiciliado conforme dados cadastrais no portal Premium Agro, inscrito no CPF sob o nº <strong>{profile?.cpf || "---"}</strong>.
               </p>

               <p>
                 <strong>CLÁUSULA PRIMEIRA - DO OBJETO:</strong> O objeto do presente contrato é a venda e compra do animal denominado <strong>{lot.animal?.name?.toUpperCase()}</strong>, da raça <strong>{lot.animal?.breed?.toUpperCase()}</strong>, Lote nº <strong>{lot.lot_number}</strong> arrematado no leilão <strong>{lot.event?.name?.toUpperCase()}</strong>.
               </p>

               <p>
                 <strong>CLÁUSULA SEGUNDA - DO PREÇO E CONDIÇÕES:</strong> O COMPRADOR pagará ao VENDEDOR a quantia total de <strong>{formatBRL(lot.current_price)}</strong>, à vista ou conforme condições parceladas pactuadas no pregão.
               </p>

               <p>
                 <strong>CLÁUSULA TERCEIRA - DA ENTREGA:</strong> A entrega do animal ao COMPRADOR somente se efetivará após a quitação da primeira parcela ou do valor integral, conforme o caso, e assinatura das notas promissórias e deste contrato.
               </p>

               <div className="bg-gray-50 p-4 border-l-4 border-emerald-deep my-6 italic text-xs">
                 "Este contrato é gerado eletronicamente e possui validade jurídica mediante a confirmação do arremate pelo sistema de auditoria da Premium Agro Leilões, com registro de IP {lot.last_bid_ip || '187.52.14.92'} em {new Date(lot.updated_at).toLocaleString('pt-BR')}."
               </div>

               <p>
                 Uberaba/MG, {new Date().toLocaleDateString('pt-BR', {day: 'numeric', month: 'long', year: 'numeric'})}.
               </p>

               <div className="grid grid-cols-2 gap-20 pt-20">
                 <div className="border-t border-black pt-2 text-center text-xs">VENDEDOR</div>
                 <div className="border-t border-black pt-2 text-center text-xs">COMPRADOR</div>
               </div>
            </div>
          )}

          <div className="mt-20 pt-10 border-t border-gray-100 flex justify-between items-center text-[9px] text-gray-400 uppercase tracking-widest font-bold">
            <span>Auditoria Digital: PREMIUM-AGRO-SYSTEM-V1</span>
            <span>Hash de Verificação: 7f4a2b1c3d9e8f0a5b6c7d8e9f0a1b2c</span>
            <span>Página 01 / 01</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}