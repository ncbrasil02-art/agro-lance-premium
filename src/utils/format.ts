 export function formatBRL(value: number) {
   return value.toLocaleString("pt-BR", {
     style: "currency",
     currency: "BRL",
     maximumFractionDigits: 0,
   });
 }
 
const MONTHS_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Format an ISO date deterministically in America/Sao_Paulo (UTC-3, no DST currently).
// Avoids toLocaleString to keep SSR and client output identical.
export function formatDateBR(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  // Shift to São Paulo (UTC-3)
  const sp = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  const day = String(sp.getUTCDate()).padStart(2, "0");
  const month = MONTHS_PT[sp.getUTCMonth()];
  const year = sp.getUTCFullYear();
  const hour = String(sp.getUTCHours()).padStart(2, "0");
  const minute = String(sp.getUTCMinutes()).padStart(2, "0");
  return `${day} de ${month} de ${year} às ${hour}:${minute}`;
}

export function validateLiveLink(url: string) {
  if (!url) return true;
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com)\/.+$/;
  const embedRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/embed\/|player\.vimeo\.com\/video\/).+$/;
  return youtubeRegex.test(url) || vimeoRegex.test(url) || embedRegex.test(url);
}