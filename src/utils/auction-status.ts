export type AuctionStatus = 'loteamento' | 'pre_lance' | 'recebendo_lances' | 'sold' | 'finished' | 'scheduled' | 'live';

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
  if (lot.event_status === 'finished' || (eventEnd && now >= eventEnd)) return 'finished';

  if (eventStart && now >= eventStart && (!eventEnd || now < eventEnd)) {
    return 'recebendo_lances';
  }

  if (eventStart && now < eventStart) {
    return lot.allows_pre_bidding ? 'pre_lance' : 'loteamento';
  }

  return lot.status;
}