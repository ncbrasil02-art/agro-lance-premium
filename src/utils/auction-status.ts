import { useState, useEffect } from 'react';

export type AuctionStatus = 'loteamento' | 'pre_lance' | 'recebendo_lances' | 'sold' | 'passed' | 'finished' | 'scheduled' | 'live';

export function useEffectiveLotStatus(lot: {
  status: string;
  event_status?: string;
  event_type?: string;
  event_start_date?: string | null;
  event_end_date?: string | null;
  allows_pre_bidding?: boolean;
}) {
  const [status, setStatus] = useState(() => getEffectiveLotStatus(lot));

  useEffect(() => {
    const updateStatus = () => {
      const nextStatus = getEffectiveLotStatus(lot);
      setStatus(prev => prev !== nextStatus ? nextStatus : prev);
    };

    // Update every second to ensure smooth transition
    const interval = setInterval(updateStatus, 1000);
    updateStatus(); // Initial check

    return () => clearInterval(interval);
  }, [lot.status, lot.event_status, lot.event_start_date, lot.event_end_date, lot.allows_pre_bidding]);

  return status;
}

export function useEffectiveEventStatus(event: {
  status: string;
  start_date: string;
  end_date?: string | null;
}) {
  const [status, setStatus] = useState(() => getEffectiveEventStatus(event));

  useEffect(() => {
    const updateStatus = () => {
      const nextStatus = getEffectiveEventStatus(event);
      setStatus(prev => prev !== nextStatus ? nextStatus : prev);
    };

    const interval = setInterval(updateStatus, 1000);
    updateStatus();

    return () => clearInterval(interval);
  }, [event.status, event.start_date, event.end_date]);

  return status;
}

export function getEffectiveEventStatus(event: {
  status: string;
  start_date: string;
  end_date?: string | null;
}) {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = event.end_date ? new Date(event.end_date) : null;

  if (event.status === 'finished') return 'finished';
  if (event.status === 'recebendo_lances' || event.status === 'live') return 'live';
  if (end && now >= end) return 'finished';
  
  // Safeguard: Se começou há mais de 48h e não tem data de fim nem status manual "live", 
  // assumimos que encerrou para evitar eventos zumbis na home.
  if (now.getTime() - start.getTime() > 48 * 60 * 60 * 1000 && event.status !== 'live') {
    return 'finished';
  }

  if (now >= start && (!end || now < end)) return 'live';
  return 'scheduled';
}

export function getEffectiveLotStatus(lot: {
  status: string;
  event_status?: string;
  event_type?: string;
  event_start_date?: string | null;
  event_end_date?: string | null;
  allows_pre_bidding?: boolean;
}) {
  const now = new Date();
  const eventStart = lot.event_start_date ? new Date(lot.event_start_date) : null;
  const eventEnd = lot.event_end_date ? new Date(lot.event_end_date) : null;

  if (lot.status === 'sold' || lot.status === 'finished' || lot.status === 'arrematado') return 'sold';
  if (lot.status === 'passed') return 'passed';
  if (lot.status === 'em_condicional') return 'passed'; // Treating conditional as passed for UI if it's not receiving bids
  if (lot.status === 'evento_adiado') return 'scheduled';

   if (lot.event_status === 'finished' || (eventEnd && now >= eventEnd)) {
     if (lot.status === 'sold') return 'sold';
     if (lot.status === 'passed') return 'passed';
     // Se o evento acabou e o lote não foi vendido/passado manualmente, 
     // provavelmente encerrou sem lances ou não foi arrematado.
     return 'passed';
   }

   // Regras específicas para eventos "Ao Vivo" vs "Online"
   if (lot.event_type === 'ao_vivo') {
     // Em leilão ao vivo, o lote só recebe lances se estiver ativo no auditório
     if (lot.status === 'active' || lot.status === 'live' || lot.status === 'recebendo_lances') return 'live';
     if (lot.status === 'scheduled') return 'scheduled';
     // Se o evento é ao vivo mas o lote não está ativo e nem vendido/passado, ele está em "loteamento"
     return 'loteamento';
   }

  // Se a data de início do evento já passou há mais de 24h e não tem data de fim, 
  // provavelmente já encerrou (safeguard para eventos esquecidos abertos)
  if (eventStart && !eventEnd && now.getTime() - eventStart.getTime() > 24 * 60 * 60 * 1000 && lot.event_status !== 'live') {
    return lot.status === 'sold' ? 'sold' : 'finished';
  }

   if (eventStart) {
     // If current date is past start date and not past end date
     if (now >= eventStart && (!eventEnd || now < eventEnd)) {
       return 'recebendo_lances';
     }
     
     // If current date is before start date
     if (now < eventStart) {
       return lot.allows_pre_bidding ? 'pre_lance' : 'loteamento';
     }
   }

  return lot.status;
}