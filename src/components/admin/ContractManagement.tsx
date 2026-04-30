import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2, FileText, Download, CheckCircle2, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";

export function ContractManagement() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchContracts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          transaction:transactions(
            id, 
            final_price,
            buyer:profiles!transactions_buyer_id_fkey(full_name, email),
            lot:lots(lot_number, animal:animals(name))
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar contratos: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const filteredContracts = contracts.filter(c => 
    c.transaction?.buyer?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.transaction?.lot?.animal?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por comprador ou animal..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={fetchContracts} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Atualizar Lista
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestão de Contratos e Assinaturas</CardTitle>
          <CardDescription>Monitore o status das assinaturas digitais de todos os arremates.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead>Lote / Animal</TableHead>
                    <TableHead>Comprador</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContracts.length > 0 ? (
                    filteredContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="text-xs">
                          {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-bold">Lote #{contract.transaction?.lot?.lot_number}</div>
                          <div className="text-[10px] text-muted-foreground uppercase">{contract.transaction?.lot?.animal?.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{contract.transaction?.buyer?.full_name}</div>
                          <div className="text-[10px] text-muted-foreground">{contract.transaction?.buyer?.email}</div>
                        </TableCell>
                        <TableCell className="font-bold text-emerald-600">
                          {formatBRL(contract.transaction?.final_price || 0)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={contract.status === 'signed' ? 'default' : 'secondary'} className="flex w-fit items-center gap-1">
                            {contract.status === 'signed' ? (
                              <><CheckCircle2 className="h-3 w-3" /> Assinado</>
                            ) : (
                              <><Clock className="h-3 w-3" /> Pendente</>
                            )}
                          </Badge>
                          {contract.signed_at && (
                            <div className="text-[9px] text-muted-foreground mt-1">
                              em {new Date(contract.signed_at).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {contract.contract_url && (
                              <Button variant="ghost" size="icon" asChild title="Ver Contrato">
                                <a href={contract.contract_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4 text-blue-500" />
                                </a>
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" title="Baixar PDF">
                              <Download className="h-4 w-4 text-emerald-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhum contrato encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
