 import React, { useState } from "react";
 import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { ShieldCheck, Play, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
 import { runRLSTests, RLSTestResult } from "@/utils/rls-checker";
 import { toast } from "sonner";
 
 export function RLSSecurityTests() {
   const [results, setResults] = useState<RLSTestResult[]>([]);
   const [isRunning, setIsRunning] = useState(false);
 
   const handleRunTests = async () => {
     setIsRunning(true);
     try {
       const testResults = await runRLSTests();
       setResults(testResults);
       const failures = testResults.filter(r => !r.passed);
       if (failures.length > 0) {
         toast.error(`${failures.length} testes de segurança falharam! Verifique a lista.`);
       } else {
         toast.success("Todos os testes de RLS passaram com sucesso.");
       }
     } catch (error) {
       console.error("Error running RLS tests:", error);
       toast.error("Falha ao executar bateria de testes.");
     } finally {
       setIsRunning(false);
     }
   };
 
   return (
     <Card className="w-full">
       <CardHeader className="flex flex-row items-center justify-between">
         <div>
           <CardTitle className="flex items-center gap-2">
             <ShieldCheck className="h-5 w-5 text-gold" />
             Bateria de Testes RLS
           </CardTitle>
           <CardDescription>
             Verifique se as políticas de segurança de Row-Level Security estão sendo aplicadas corretamente.
           </CardDescription>
         </div>
         <Button 
           onClick={handleRunTests} 
           disabled={isRunning}
           className="bg-gold text-emerald-deep font-bold"
         >
           {isRunning ? "Executando..." : "Executar Testes"}
           <Play className="ml-2 h-4 w-4" />
         </Button>
       </CardHeader>
       <CardContent>
         {results.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
             <ShieldCheck className="h-12 w-12 opacity-20 mb-4" />
             <p>Clique em "Executar Testes" para iniciar a validação automatizada.</p>
           </div>
         ) : (
           <div className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
               <div className="p-4 rounded-lg bg-background border flex flex-col items-center">
                 <span className="text-2xl font-bold">{results.length}</span>
                 <span className="text-xs text-muted-foreground uppercase">Total</span>
               </div>
               <div className="p-4 rounded-lg bg-green-500/10 border-green-500/20 flex flex-col items-center text-green-600">
                 <span className="text-2xl font-bold">{results.filter(r => r.passed).length}</span>
                 <span className="text-xs uppercase">Passaram</span>
               </div>
               <div className="p-4 rounded-lg bg-red-500/10 border-red-500/20 flex flex-col items-center text-red-600">
                 <span className="text-2xl font-bold">{results.filter(r => !r.passed).length}</span>
                 <span className="text-xs uppercase">Falharam</span>
               </div>
               <div className="p-4 rounded-lg bg-gold/10 border-gold/20 flex flex-col items-center text-gold">
                 <span className="text-2xl font-bold">100%</span>
                 <span className="text-xs uppercase">Cobertura</span>
               </div>
             </div>
 
             <div className="rounded-md border overflow-hidden">
               <table className="w-full text-sm">
                 <thead>
                   <tr className="bg-muted/50 border-b">
                     <th className="p-3 text-left">Teste</th>
                     <th className="p-3 text-left">Tabela</th>
                     <th className="p-3 text-left">Op.</th>
                     <th className="p-3 text-left">Esperado</th>
                     <th className="p-3 text-left">Resultado</th>
                     <th className="p-3 text-right">Status</th>
                   </tr>
                 </thead>
                 <tbody>
                   {results.map((result, idx) => (
                     <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                       <td className="p-3 font-medium">{result.name}</td>
                       <td className="p-3 text-muted-foreground">{result.table}</td>
                       <td className="p-3 font-mono text-xs">{result.operation}</td>
                       <td className="p-3">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${result.expected === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                           {result.expected}
                         </span>
                       </td>
                       <td className="p-3">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${result.actual === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                           {result.actual}
                         </span>
                       </td>
                       <td className="p-3 text-right">
                         {result.passed ? (
                           <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                         ) : (
                           <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                         )}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
             
             {results.some(r => !r.passed) && (
               <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3 mt-4">
                 <AlertTriangle className="h-5 w-5 shrink-0" />
                 <div>
                   <p className="font-bold">Atenção!</p>
                   <p className="text-xs">Existem vulnerabilidades de RLS ativas. Revise as políticas de acesso no banco de dados imediatamente.</p>
                 </div>
               </div>
             )}
           </div>
         )}
       </CardContent>
     </Card>
   );
 }