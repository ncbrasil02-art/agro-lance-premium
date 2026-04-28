import json
import uuid
import random
from datetime import datetime, timedelta

def generate_uuid():
    return str(uuid.uuid4())

def get_now_with_tz():
    return datetime.now().strftime('%Y-%m-%dT%H:%M:%S+00:00')

# Sellers and Categories (using IDs from DB)
SELLER_ID = "47603e52-977b-4744-922e-d6d5a4b7b296" # Fazenda Hamv
CATEGORY_ID = "41525c71-f485-4910-aaa5-8ee7e85a6793" # Manga-larga

animals = [
    {
        "id": generate_uuid(),
        "name": "REI DO DIAMANTE",
        "breed": "Manga-larga Marchador",
        "sex": "M",
        "birth_date": "2018-05-15",
        "color": "Tordilho",
        "weight": 450,
        "height": 1.55,
        "location": "Belo Horizonte, MG",
        "description": "Garanhão de elite, marcha batida clássica. Genética comprovada.",
        "photos": ["https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=800"],
        "seller_id": SELLER_ID,
        "category_id": CATEGORY_ID,
        "internal_code": "AN-0001",
        "accepts_offers": True,
        "veterinary_history": {"prognata": False, "aerofagico": False, "laminite": False, "other_info": "Saúde impecável, exames em dia."}
    },
    {
        "id": generate_uuid(),
        "name": "ESTRELA DA MANHÃ",
        "breed": "Manga-larga Marchador",
        "sex": "F",
        "birth_date": "2020-02-10",
        "color": "Alazã",
        "weight": 420,
        "height": 1.52,
        "location": "Itaúna, MG",
        "description": "Doadora de embriões, filha de campeões nacionais.",
        "photos": ["https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80&w=800"],
        "seller_id": SELLER_ID,
        "category_id": CATEGORY_ID,
        "internal_code": "AN-0002",
        "accepts_offers": True,
        "veterinary_history": {"prognata": False, "aerofagico": False, "cicatrizes": True, "other_info": "Pequena cicatriz no jarrete posterior esquerdo."}
    },
    {
        "id": generate_uuid(),
        "name": "TROVÃO NEGRO",
        "breed": "Quarto de Milha",
        "sex": "M",
        "birth_date": "2019-11-20",
        "color": "Preto",
        "weight": 510,
        "height": 1.58,
        "location": "Sorocaba, SP",
        "description": "Potencial para Laço e Rédeas. Explosão e docilidade.",
        "photos": ["https://images.unsplash.com/photo-1534073737927-85f1df9605d2?auto=format&fit=crop&q=80&w=800"],
        "seller_id": SELLER_ID,
        "category_id": CATEGORY_ID,
        "internal_code": "AN-0003",
        "accepts_offers": True,
        "veterinary_history": {"prognata": False, "aerofagico": False, "hypp": False}
    },
    {
        "id": generate_uuid(),
        "name": "PÉROLA RARA",
        "breed": "Árabe",
        "sex": "F",
        "birth_date": "2021-08-05",
        "color": "Branca",
        "weight": 380,
        "height": 1.48,
        "location": "Campinas, SP",
        "description": "Potra de extrema beleza e refinamento. Movimentação leve.",
        "photos": ["https://images.unsplash.com/photo-1551884831-bbf3cdc6469e?auto=format&fit=crop&q=80&w=800"],
        "seller_id": SELLER_ID,
        "category_id": CATEGORY_ID,
        "internal_code": "AN-0004",
        "accepts_offers": True,
        "veterinary_history": {"prognata": False, "aerofagico": False}
    },
    {
        "id": generate_uuid(),
        "name": "BAIO DE OURO",
        "breed": "Crioulo",
        "sex": "M",
        "birth_date": "2017-12-30",
        "color": "Baio",
        "weight": 465,
        "height": 1.45,
        "location": "Bagé, RS",
        "description": "Domado, excelente para lida e provas funcionais.",
        "photos": ["https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80&w=800"],
        "seller_id": SELLER_ID,
        "category_id": CATEGORY_ID,
        "internal_code": "AN-0005",
        "accepts_offers": True,
        "veterinary_history": {"prognata": False, "aerofagico": False, "cirurgia_grave": False}
    }
]

events = [
    {
        "id": generate_uuid(),
        "name": "Leilão Virtual Elite Nordeste",
        "event_type": "online",
        "status": "upcoming",
        "start_date": (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%dT20:00:00+00:00'),
        "allows_pre_bidding": True,
        "location": "Virtual - Transmissão YouTube",
        "description": "Os melhores exemplares da raça Manga-larga Marchador.",
        "banner_url": "https://images.unsplash.com/photo-1551884831-bbf3cdc6469e?auto=format&fit=crop&q=80&w=1200"
    },
    {
        "id": generate_uuid(),
        "name": "Leilão Presencial Haras Monte Belo",
        "event_type": "live",
        "status": "upcoming",
        "start_date": (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%dT14:00:00+00:00'),
        "allows_pre_bidding": False,
        "location": "Haras Monte Belo - Itaúna, MG",
        "description": "Evento presencial com transmissão ao vivo.",
        "banner_url": "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80&w=1200"
    },
    {
        "id": generate_uuid(),
        "name": "Liquidação Plantel Fazenda Hamv",
        "event_type": "online",
        "status": "upcoming",
        "start_date": (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%dT19:00:00+00:00'),
        "allows_pre_bidding": True,
        "location": "Online",
        "description": "Oportunidade única de adquirir genética hamv.",
        "banner_url": "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=1200"
    },
    {
        "id": generate_uuid(),
        "name": "Gala das Estrelas 2026",
        "event_type": "live",
        "status": "upcoming",
        "start_date": (datetime.now() + timedelta(days=15)).strftime('%Y-%m-%dT21:00:00+00:00'),
        "allows_pre_bidding": True,
        "location": "Hotel Transamérica, SP",
        "description": "O leilão mais luxuoso da temporada.",
        "banner_url": "https://images.unsplash.com/photo-1534073737927-85f1df9605d2?auto=format&fit=crop&q=80&w=1200"
    },
    {
        "id": generate_uuid(),
        "name": "Venda Direta Especial de Outono",
        "event_type": "online",
        "status": "upcoming",
        "start_date": (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%dT08:00:00+00:00'),
        "allows_pre_bidding": False,
        "location": "Plataforma Premium Agro",
        "description": "Venda direta com preços fixos e propostas.",
        "banner_url": "https://images.unsplash.com/photo-1518467166778-b88f373ffec7?auto=format&fit=crop&q=80&w=1200"
    }
]

lots = []
for i in range(5):
    lots.append({
        "id": generate_uuid(),
        "event_id": events[i]["id"],
        "animal_id": animals[i]["id"],
        "lot_number": i + 1,
        "starting_price": random.randint(20000, 100000),
        "current_price": 0,
        "bid_increment": 1000,
        "status": "upcoming",
        "allows_pre_bidding": events[i]["allows_pre_bidding"]
    })
    lots[i]["current_price"] = lots[i]["starting_price"]

print("INSERT INTO public.animals (id, name, breed, sex, birth_date, color, weight, height, location, description, photos, seller_id, category_id, internal_code, accepts_offers, veterinary_history) VALUES")
animal_values = []
for a in animals:
    animal_values.append(f"('{a['id']}', '{a['name']}', '{a['breed']}', '{a['sex']}', '{a['birth_date']}', '{a['color']}', {a['weight']}, {a['height']}, '{a['location']}', '{a['description']}', ARRAY{a['photos']}, '{a['seller_id']}', '{a['category_id']}', '{a['internal_code']}', {str(a['accepts_offers']).lower()}, '{json.dumps(a['veterinary_history'])}')")
print(",\n".join(animal_values) + ";")

print("\nINSERT INTO public.events (id, name, event_type, status, start_date, allows_pre_bidding, location, description, banner_url) VALUES")
event_values = []
for e in events:
    event_values.append(f"('{e['id']}', '{e['name']}', '{e['event_type']}', '{e['status']}', '{e['start_date']}', {str(e['allows_pre_bidding']).lower()}, '{e['location']}', '{e['description']}', '{e['banner_url']}')")
print(",\n".join(event_values) + ";")

print("\nINSERT INTO public.lots (id, event_id, animal_id, lot_number, starting_price, current_price, bid_increment, status, allows_pre_bidding) VALUES")
lot_values = []
for l in lots:
    lot_values.append(f"('{l['id']}', '{l['event_id']}', '{l['animal_id']}', {l['lot_number']}, {l['starting_price']}, {l['current_price']}, {l['bid_increment']}, '{l['status']}', {str(l['allows_pre_bidding']).lower()})")
print(",\n".join(lot_values) + ";")
