import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShieldAlert, ShieldCheck, Fingerprint, Globe, User, Clock, Loader2, AlertTriangle, Info } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function BidSecurityAudit() {
  const [bids, setBids] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchBids = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("bids")
        .select(`
          *,
          profile:profiles(full_name, risk_level, is_blocked, cpf),
          lot:lots(lot_number, animal:animals(name))
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setBids(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar auditoria: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();

    // Realtime subscription for new bids - optimize to avoid full re-fetches
    const uniqueId = `bid-security-audit-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(uniqueId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids" },
        async (payload) => {
          console.log("New bid in audit:", payload.new);
          // Fetch the bid with its relations to keep the UI consistent
          const { data: bidWithDetails } = await supabase
            .from("bids")
            .select(`
              *,
              profile:profiles(full_name, risk_level, is_blocked, cpf),
              lot:lots(lot_number, animal:animals(name))
            `)
            .eq("id", payload.new.id)
            .single();
          
          if (bidWithDetails) {
            setBids(prev => [bidWithDetails, ...prev].slice(0, 100));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bids" },
        (payload) => {
          setBids(prev => prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          // Update the profile info in existing bids
          setBids(prev => prev.map(bid => {
            if (bid.user_id === payload.new.id) {
              return { ...bid, profile: { ...bid.profile, ...payload.new } };
            }
            return bid;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_blocked: !currentStatus,
          block_reason: !currentStatus ? "Bloqueado após auditoria de segurança de lances" : null
        })
        .eq("id", userId);

      if (error) throw error;
      toast.success(currentStatus ? "Usuário desbloqueado" : "Usuário bloqueado");
      fetchBids();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  const filteredBids = bids.filter(bid => {
    const searchLower = searchQuery.toLowerCase();
    return (
      bid.profile?.full_name?.toLowerCase().includes(searchLower) ||
      bid.ip_address?.includes(searchQuery) ||
      bid.session_id?.includes(searchQuery) ||
      bid.lot?.animal?.name?.toLowerCase().includes(searchLower)
    );
  });

  // Heurística simples para detectar duplicidade de sessão/IP em usuários diferentes
  const getSecurityWarnings = (bid: any) => {
    const warnings = [];
    
    const sameIpDifferentUser = bids.find(b => 
      b.ip_address === bid.ip_address && b.user_id !== bid.user_id && b.ip_address !== null
    );
    if (sameIpDifferentUser) {
      warnings.push("Mesmo IP detectado em contas diferentes");
    }

    const sameSessionDifferentUser = bids.find(b => 
      b.session_id === bid.session_id && b.user_id !== bid.user_id && b.session_id !== null
    );
    if (sameSessionDifferentUser) {
      warnings.push("Mesma sessão detectada em contas diferentes");
    }

    return warnings;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filtrar por nome, IP ou sessão..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchBids} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Atualizar"}
          Recarregar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-gold" />
            Auditoria de Segurança de Lances
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real de IPs, sessões e riscos de cada lance efetuado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Momento</TableHead>
                  <TableHead className="font-bold">Licitante</TableHead>
                  <TableHead className="font-bold">Lote / Valor</TableHead>
                  <TableHead className="font-bold">IP / Sessão</TableHead>
                  <TableHead className="font-bold">Segurança</TableHead>
                  <TableHead className="text-right font-bold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-gold" />
                    </TableCell>
                  </TableRow>
                ) : filteredBids.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nenhum lance registrado recentemente.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBids.map((bid) => {
                    const warnings = getSecurityWarnings(bid);
                    return (
                      <TableRow key={bid.id} className={warnings.length > 0 ? "bg-destructive/5" : "hover:bg-muted/30"}>
                        <TableCell className="text-xs">
                          <div className="flex flex-col">
                            <span className="font-medium">{format(new Date(bid.created_at), "HH:mm:ss", { locale: ptBR })}</span>
                            <span className="text-muted-foreground">{format(new Date(bid.created_at), "dd/MM/yyyy")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gold" />
                               <span className="font-medium text-sm">{bid.bidder_name}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">{bid.profile?.cpf}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">Lote #{bid.lot?.lot_number}</span>
                            <span className="text-xs text-emerald-deep font-black">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bid.amount)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-[10px] font-mono">
                            <div className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded w-fit">
                              <Globe className="h-2.5 w-2.5" /> {bid.ip_address || "IP Oculto"}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded w-fit">
                              <Fingerprint className="h-2.5 w-2.5" /> {bid.session_id ? `${bid.session_id.substring(0, 8)}...` : "Sessão N/A"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {bid.profile?.risk_level === 'high' ? (
                              <Badge variant="destructive" className="w-fit text-[9px] h-4">ALTO RISCO</Badge>
                            ) : bid.profile?.risk_level === 'medium' ? (
                              <Badge variant="secondary" className="bg-orange-500 text-white w-fit text-[9px] h-4">RISCO MÉDIO</Badge>
                            ) : (
                              <Badge variant="outline" className="text-emerald-500 border-emerald-500 w-fit text-[9px] h-4">SEGURO</Badge>
                            )}
                            
                            {warnings.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1 text-destructive font-bold text-[9px] animate-pulse">
                                      <AlertTriangle className="h-3 w-3" /> SUSPEITO
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <ul className="text-xs list-disc pl-4">
                                      {warnings.map((w, i) => <li key={i}>{w}</li>)}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleBlock(bid.user_id, bid.profile?.is_blocked)}
                                  className={bid.profile?.is_blocked ? "text-emerald-500" : "text-destructive"}
                                >
                                  {bid.profile?.is_blocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {bid.profile?.is_blocked ? "Desbloquear" : "Bloquear Usuário"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-deep/5 border-emerald-500/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" /> Proteção de Sessão
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Cada navegador gera um ID de sessão único. Se o mesmo ID aparecer em contas com CPFs diferentes, o sistema emite um alerta de fraude.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Escala de Risco
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              O sistema monitora a cadência de lances. Mais de 5 lances/min elevam o risco para Médio (bloqueio 15min). Mais de 10 lances/min elevam para Alto (bloqueio permanente).
            </p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Bloqueio por IP
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Rastreamos o IP de origem. Múltiplas contas operando do mesmo IP simultaneamente são sinalizadas para revisão manual do administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}