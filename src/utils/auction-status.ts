import { useState, useEffect } from 'react';

export type AuctionStatus = 'loteamento' | 'pre_lance' | 'recebendo_lances' | 'sold' | 'finished' | 'scheduled' | 'live';

export function useEffectiveLotStatus(lot: {
  status: string;
  event_status?: string;
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
  if (end && now >= end) return 'finished';
  if (now >= start && (!end || now < end)) return 'live';
  return 'scheduled';
}

export function getEffectiveLotStatus(lot: {
  status: string;
  event_status?: string;
  event_start_date?: string | null;
  event_end_date?: string | null;
  allows_pre_bidding?: boolean;
}) {
  const now = new Date();
  const eventStart = lot.event_start_date ? new Date(lot.event_start_date) : null;
  const eventEnd = lot.event_end_date ? new Date(lot.event_end_date) : null;

  if (lot.status === 'sold' || lot.status === 'finished') return 'sold';
  if (lot.event_status === 'finished' || (eventEnd && now >= eventEnd)) {
    return lot.status === 'sold' ? 'sold' : 'finished';
  }

  // Se a data de início do evento já passou há mais de 24h e não tem data de fim, 
  // provavelmente já encerrou (safeguard para eventos esquecidos abertos)
  if (eventStart && !eventEnd && now.getTime() - eventStart.getTime() > 24 * 60 * 60 * 1000 && lot.event_status !== 'live') {
    return lot.status === 'sold' ? 'sold' : 'finished';
  }

  if (eventStart && now >= eventStart && (!eventEnd || now < eventEnd)) {
    return 'recebendo_lances';
  }

  if (eventStart && now < eventStart) {
    return lot.allows_pre_bidding ? 'pre_lance' : 'loteamento';
  }

  return lot.status;
}