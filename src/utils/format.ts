 export function formatBRL(value: number) {
   return value.toLocaleString("pt-BR", {
     style: "currency",
     currency: "BRL",
     maximumFractionDigits: 0,
   });
 }
 
 export function formatDateBR(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
 }