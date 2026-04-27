import horse1 from "@/assets/animal-horse-1.jpg";
import horse2 from "@/assets/animal-horse-2.jpg";
import horse3 from "@/assets/animal-horse-3.jpg";
import bull1 from "@/assets/animal-bull-1.jpg";
import bull2 from "@/assets/animal-bull-2.jpg";
import event1 from "@/assets/event-1.jpg";
import event2 from "@/assets/event-2.jpg";

export type EventStatus = "live" | "upcoming" | "closed";

export interface AuctionEvent {
  id: string;
  slug: string;
  name: string;
  description: string;
  date: string;
  city: string;
  state: string;
  cover: string;
  status: EventStatus;
  lotsCount: number;
  viewers: number;
  bidsCount: number;
  auctioneer: string;
  promoter: string;
  event_type?: string;
}

export interface Lot {
  id: string;
  number: number;
  eventId: string;
  name: string;
  breed: string;
  category: "Equino" | "Bovino" | "Embrião";
  cover: string;
  currentBid: number;
  minIncrement: number;
  bidsCount: number;
  viewers: number;
  endsAt?: string;
  status?: any;
}

export const events: AuctionEvent[] = [
  {
    id: "evt-1",
    slug: "elite-equinos-2025",
    name: "Elite Equinos 2025",
    description: "Leilão premium de cavalos de alta linhagem com seleção genética superior.",
    date: "2025-05-12T20:00:00-03:00",
    city: "Ribeirão Preto",
    state: "SP",
    cover: event1,
    status: "live",
    lotsCount: 48,
    viewers: 1284,
    bidsCount: 392,
    auctioneer: "Carlos Mendes",
    promoter: "Haras São Bento",
  },
  {
    id: "evt-2",
    slug: "nelore-campeoes",
    name: "Nelore Campeões — 12ª Edição",
    description: "Os melhores reprodutores e matrizes Nelore PO selecionados pela ABCZ.",
    date: "2025-06-04T19:30:00-03:00",
    city: "Uberaba",
    state: "MG",
    cover: event2,
    status: "upcoming",
    lotsCount: 72,
    viewers: 0,
    bidsCount: 0,
    auctioneer: "Pedro Junqueira",
    promoter: "Fazenda Boa Vista",
  },
  {
    id: "evt-3",
    slug: "embrioes-de-elite",
    name: "Embriões de Elite — Genética Premium",
    description: "Embriões selecionados de matrizes campeãs com pedigree internacional.",
    date: "2025-05-25T20:00:00-03:00",
    city: "Goiânia",
    state: "GO",
    cover: event1,
    status: "upcoming",
    lotsCount: 32,
    viewers: 0,
    bidsCount: 0,
    auctioneer: "Marina Costa",
    promoter: "Genética Premium Brasil",
  },
  {
    id: "evt-4",
    slug: "mangalarga-tradicao",
    name: "Mangalarga Marchador — Tradição",
    description: "Edição comemorativa com os mais finos exemplares da raça nacional.",
    date: "2025-04-18T19:00:00-03:00",
    city: "Belo Horizonte",
    state: "MG",
    cover: event2,
    status: "closed",
    lotsCount: 56,
    viewers: 2104,
    bidsCount: 871,
    auctioneer: "Roberto Silva",
    promoter: "Haras Real",
  },
];

export const lots: Lot[] = [
  {
    id: "lot-1",
    number: 1,
    eventId: "evt-1",
    name: "Imperador do Vale",
    breed: "Mangalarga Marchador",
    category: "Equino",
    cover: horse1,
    currentBid: 285000,
    minIncrement: 1000,
    bidsCount: 47,
    viewers: 312,
    endsAt: new Date(Date.now() + 1000 * 60 * 12).toISOString(),
    status: "live",
  },
  {
    id: "lot-2",
    number: 2,
    eventId: "evt-1",
    name: "Estrela Dourada",
    breed: "Quarto de Milha",
    category: "Equino",
    cover: horse2,
    currentBid: 142000,
    minIncrement: 500,
    bidsCount: 28,
    viewers: 198,
    endsAt: new Date(Date.now() + 1000 * 60 * 35).toISOString(),
    status: "open",
  },
  {
    id: "lot-3",
    number: 3,
    eventId: "evt-1",
    name: "Sombra da Noite",
    breed: "Lusitano",
    category: "Equino",
    cover: horse3,
    currentBid: 420000,
    minIncrement: 2000,
    bidsCount: 63,
    viewers: 487,
    endsAt: new Date(Date.now() + 1000 * 60 * 58).toISOString(),
    status: "open",
  },
  {
    id: "lot-4",
    number: 12,
    eventId: "evt-2",
    name: "Touro Rei do Pasto",
    breed: "Nelore PO",
    category: "Bovino",
    cover: bull1,
    currentBid: 95000,
    minIncrement: 500,
    bidsCount: 15,
    viewers: 142,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    status: "scheduled",
  },
  {
    id: "lot-5",
    number: 18,
    eventId: "evt-2",
    name: "Brangus Imperial",
    breed: "Brangus",
    category: "Bovino",
    cover: bull2,
    currentBid: 78000,
    minIncrement: 500,
    bidsCount: 9,
    viewers: 87,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
    status: "scheduled",
  },
  {
    id: "lot-6",
    number: 4,
    eventId: "evt-1",
    name: "Princesa do Cerrado",
    breed: "Mangalarga Marchador",
    category: "Equino",
    cover: horse1,
    currentBid: 198000,
    minIncrement: 1000,
    bidsCount: 34,
    viewers: 221,
    endsAt: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    status: "open",
  },
];

export const stats = {
  totalSold: 184_500_000,
  totalAnimals: 12_847,
  totalUsers: 38_420,
  activeEvents: 14,
};

 export { formatBRL, formatDateBR } from "@/utils/format";
