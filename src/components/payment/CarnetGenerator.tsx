import React from "react";
import { Installment } from "@/utils/payment-calculator";
import { formatBRL } from "@/utils/format";
import { QRCodeSVG } from "qrcode.react";
import { Receipt, Scissors } from "lucide-react";

interface CarnetGeneratorProps {
  lot: any;
  installments: Installment[];
  pixKey: string;
  pixQRCode?: string;
  profile: any;
  siteInfo: any;
}

export function CarnetGenerator({ lot, installments, pixKey, pixQRCode, profile, siteInfo }: CarnetGeneratorProps) {
  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:p-0 print:max-w-none" id="printable-carnet">
      <div className="space-y-8">
        {installments.map((inst, index) => (
          <div key={index} className="border-2 border-dashed border-gray-300 p-6 relative bg-white overflow-hidden break-inside-avoid">
            {/* Cut line indicator */}
            <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2 print:hidden">
              <div className="bg-white px-2 flex items-center gap-1 text-gray-400 text-[10px] font-bold">
                <Scissors className="h-3 w-3" /> CORTE AQUI
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Left Side: Receipt Stub (Canhoto) */}
              <div className="md:col-span-1 border-r border-gray-200 pr-6 space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-bold text-gray-400 uppercase">Recibo do Pagador</p>
                  <h3 className="text-sm font-black text-emerald-deep">CARNÊ #{(lot.lot_number || lot.id.substring(0,4))}</h3>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Parcela</p>
                    <p className="text-xs font-bold text-gray-800">{inst.installment_number}/{installments.length}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Vencimento</p>
                    <p className="text-xs font-bold text-emerald-600">{inst.due_date.toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Valor</p>
                    <p className="text-xs font-bold text-gray-800">{formatBRL(inst.amount)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-[7px] text-gray-400 italic">Autenticação Mecânica / Carimbo</p>
                  <div className="h-12 border border-gray-100 mt-1 bg-gray-50/50 rounded"></div>
                </div>
              </div>

              {/* Right Side: Main Ticket (Ficha de Compensação) */}
              <div className="md:col-span-3 pl-0 md:pl-2 space-y-4">
                <div className="flex justify-between items-start border-b-2 border-emerald-deep pb-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-6 w-6 text-gold" />
                    <div>
                      <h2 className="text-base font-black text-emerald-deep leading-none uppercase">{siteInfo?.name || "Plataforma de Leilões"}</h2>
                      <p className="text-[8px] text-gray-500 font-medium">Pagamento via PIX / Boleto Bancário</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-deep">DOC: {(lot.lot_number || lot.id.substring(0,6))}-{inst.installment_number}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-[10px]">
                  <div className="col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-b border-gray-100 pb-1">
                        <p className="text-[7px] font-bold text-gray-400 uppercase italic">Beneficiário</p>
                        <p className="font-bold truncate text-gray-800">{siteInfo?.company_name || siteInfo?.name || "Administração"}</p>
                      </div>
                      <div className="border-b border-gray-100 pb-1 text-right">
                        <p className="text-[7px] font-bold text-gray-400 uppercase italic">CPF/CNPJ</p>
                        <p className="font-bold text-gray-800">{siteInfo?.document || "---"}</p>
                      </div>
                    </div>

                    <div className="border-b border-gray-100 pb-1">
                      <p className="text-[7px] font-bold text-gray-400 uppercase italic">Pagador</p>
                      <p className="font-bold text-gray-800">{profile.full_name || "Cliente não identificado"}</p>
                      <p className="text-[8px] text-gray-500">{profile.cpf ? `CPF: ${profile.cpf}` : ""}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="border-b border-gray-100 pb-1">
                        <p className="text-[7px] font-bold text-gray-400 uppercase italic">Data Emissão</p>
                        <p className="font-bold text-gray-800">{new Date().toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="border-b border-gray-100 pb-1 text-center">
                        <p className="text-[7px] font-bold text-gray-400 uppercase italic">Lote</p>
                        <p className="font-bold text-gray-800">#{lot.lot_number || "---"}</p>
                      </div>
                      <div className="border-b border-gray-100 pb-1 text-right">
                        <p className="text-[7px] font-bold text-gray-400 uppercase italic">Animal</p>
                        <p className="font-bold text-gray-800 truncate">{lot.animal?.name || "---"}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-[7px] font-bold text-gray-400 uppercase italic mb-1">Instruções de Pagamento</p>
                      <p className="text-[9px] text-gray-600 leading-tight">
                        Realize o pagamento através do QR Code ao lado ou utilize a chave PIX: <span className="font-bold font-mono">{pixKey}</span>. 
                        Após o pagamento, anexe o comprovante no painel do cliente para a devida baixa.
                      </p>
                    </div>
                  </div>

                  <div className="col-span-1 border-l border-gray-100 pl-4 space-y-4 bg-gray-50/30 p-2 rounded-r-lg">
                    <div className="text-right">
                      <p className="text-[7px] font-bold text-gray-400 uppercase italic">Vencimento</p>
                      <p className="text-sm font-black text-emerald-deep">{inst.due_date.toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] font-bold text-gray-400 uppercase italic">Parcela</p>
                      <p className="text-xs font-bold text-gray-800">{inst.installment_number}/{installments.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] font-bold text-gray-400 uppercase italic">Valor do Documento</p>
                      <p className="text-sm font-black text-emerald-deep">{formatBRL(inst.amount)}</p>
                    </div>
                    
                    <div className="flex flex-col items-center gap-1 pt-2">
                      {pixQRCode ? (
                        <div className="p-1 bg-white rounded border border-gray-200">
                          <QRCodeSVG value={pixQRCode} size={80} />
                        </div>
                      ) : (
                        <div className="h-20 w-20 bg-gray-200 flex items-center justify-center rounded border border-gray-200">
                          <p className="text-[6px] text-center text-gray-400 px-2 uppercase font-black">QR CODE<br/>NÃO DISPONÍVEL</p>
                        </div>
                      )}
                      <p className="text-[6px] font-black text-emerald-deep uppercase">Pague com PIX</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}