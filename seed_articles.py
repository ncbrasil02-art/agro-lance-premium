import json
import uuid

categories = {
    "Cavalos": "bdb4c2c2-e3a2-45c9-9543-948dd1ce34ba",
    "Fazendas": "9c0123fb-56df-4ed7-9c0b-8c8953354b5f",
    "Criatórios": "26ef529e-c948-456c-9083-bd35d4200eb6",
    "Eventos de Leilão": "6f6b55c9-43b7-4931-87c3-1cccb407621d",
    "Mercado Agro": "d82eca56-d875-4ce7-bc14-4d5c57a273cd"
}

articles = [
    {
        "title": "O Crescimento dos Leilões de Quarto de Milha no Brasil",
        "category": "Cavalos",
        "excerpt": "Entenda por que a raça Quarto de Milha continua batendo recordes de faturamento nos principais leilões do país.",
        "content": "A raça Quarto de Milha consolidou sua posição como a mais versátil e valorizada no mercado brasileiro de cavalos. Recentemente, vimos leilões ultrapassarem a marca de R$ 10 milhões em faturamento, impulsionados pela genética de ponta e pela demanda em provas de Laço e Vaquejada...\n\n### Quer participar?\nNão perca a chance de adquirir um campeão. [Crie seu evento conosco](/contato) ou participe dos nossos próximos leilões.",
        "image": "https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Investir em Fazendas: Ouro Verde do Brasil",
        "category": "Fazendas",
        "excerpt": "A valorização de terras agrícolas e pecuárias atrai investidores nacionais e estrangeiros para o interior do Brasil.",
        "content": "O mercado imobiliário rural brasileiro vive um momento de ouro. Com o aumento da produtividade e a valorização das commodities, fazendas bem estruturadas tornaram-se ativos de segurança e alta rentabilidade...\n\n### Divulgue sua propriedade\nTem uma fazenda para vender ou quer realizar um leilão de terras? [Entre em contato](/contato) para criarmos uma matéria exclusiva sobre seu criatório.",
        "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "A Importância da Genética nos Criatórios de Nelore",
        "category": "Criatórios",
        "excerpt": "Como os grandes criatórios estão utilizando IATF e FIV para acelerar o melhoramento genético do rebanho nacional.",
        "content": "O Nelore é o pilar da pecuária de corte no Brasil. Criatórios renomados estão investindo pesado em tecnologias de reprodução para garantir animais com maior precocidade e qualidade de carcaça...\n\n### Conheça os melhores lotes\nVeja nossa seleção de animais com genética comprovada. [Clique aqui para ver os lotes](/lotes).",
        "image": "https://images.unsplash.com/photo-1547407139-3c921a66005c?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Tendências para o Mercado Agro em 2026",
        "category": "Mercado Agro",
        "excerpt": "O que esperar da economia e das exportações brasileiras para o próximo ano no setor agropecuário.",
        "content": "Especialistas apontam que a tecnologia será a grande protagonista no campo em 2026. Do monitoramento por satélite à automatização dos leilões, o agro brasileiro segue liderando a inovação mundial...\n\n### Fique por dentro\nAcompanhe as notícias e [inscreva-se para receber nossas notificações](/cadastro).",
        "image": "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Como Preparar seu Animal para um Leilão de Elite",
        "category": "Cavalos",
        "excerpt": "Dicas essenciais de manejo, nutrição e treinamento para garantir o melhor valor de venda no martelo.",
        "content": "A apresentação é fundamental. Um animal bem condicionado, com pelagem brilhante e temperamento dócil, atrai muito mais lances durante o evento ao vivo...\n\n### Precisa de consultoria?\nNossa equipe pode ajudar você a preparar seu leilão. [Fale conosco](/contato).",
        "image": "https://images.unsplash.com/photo-1534346505052-5e43c52e673a?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Leilões Online vs. Presenciais: O Melhor de Dois Mundos",
        "category": "Eventos de Leilão",
        "excerpt": "O modelo híbrido revolucionou o setor, permitindo lances de qualquer lugar do mundo com a emoção do recinto.",
        "content": "A tecnologia de streaming trouxe uma nova era para os leilões. Hoje, um comprador em Manaus pode arrematar um cavalo em São Paulo com apenas um clique...\n\n### Crie seu leilão híbrido\nUse nossa plataforma para alcançar compradores em todo o Brasil. [Saiba mais](/contato).",
        "image": "https://images.unsplash.com/photo-1589182337358-2c63a7f068bc?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "A Ascensão da Raça Mangalarga Marchador",
        "category": "Cavalos",
        "excerpt": "O cavalo de sela brasileiro ganha cada vez mais adeptos pela sua comodidade e beleza.",
        "content": "O Mangalarga Marchador não é apenas um cavalo de trabalho, é um estilo de vida. Com associações fortes e eventos grandiosos, a raça movimenta bilhões anualmente...\n\n### Seja um expositor\nParticipe dos nossos eventos dedicados ao Marchador. [Veja o calendário](/eventos).",
        "image": "https://images.unsplash.com/photo-1598974357801-cbca100e65d3?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Sustentabilidade: O Novo Padrão nas Fazendas Brasileiras",
        "category": "Fazendas",
        "excerpt": "Práticas ESG no campo garantem melhores preços e acesso a mercados internacionais exigentes.",
        "content": "Recuperação de pastagens, integração lavoura-pecuária-floresta (ILPF) e bem-estar animal são os pilares da nova pecuária sustentável...\n\n### Valorize seu Criatório\nMostre suas práticas sustentáveis em uma matéria especial. [Solicite aqui](/contato).",
        "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Pecuária de Leite: Genética que Enche o Balde",
        "category": "Criatórios",
        "excerpt": "Destaques das raças Gir e Girolando nos principais torneios leiteiros do país.",
        "content": "A eficiência na produção de leite começa com a escolha criteriosa das matrizes. Animais com alta capacidade produtiva e conformação ideal são o foco dos novos leiladores...\n\n### Ofertas de Leite\nConfira os lotes de animais leiteiros em destaque. [Ver lotes](/lotes).",
        "image": "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&q=80&w=800"
    },
    {
        "title": "Seguro para Animais: Proteja seu Investimento",
        "category": "Mercado Agro",
        "excerpt": "Entenda as modalidades de seguro disponíveis para equinos e bovinos de alto valor.",
        "content": "Arrematou um animal de elite? O próximo passo é garantir a proteção desse patrimônio contra acidentes e doenças...\n\n### Arrematou? Proteja!\nVeja como contratar seguro para seus animais após o leilão. [Clique aqui](/contato).",
        "image": "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=800"
    }
]

for art in articles:
    slug = art['title'].lower().replace(' ', '-').replace(':', '').replace('?', '').replace('.', '')
    sql = f"""
    INSERT INTO public.posts (title, slug, excerpt, content, featured_image, category_id, status, published_at)
    VALUES ('{art['title']}', '{slug}', '{art['excerpt']}', '{art['content']}', '{art['image']}', '{categories[art['category']]}', 'published', NOW());
    """
    print(sql)

# Also update featured events and lots
print("UPDATE public.events SET is_featured = true WHERE id IN (SELECT id FROM events LIMIT 3);")
print("UPDATE public.lots SET is_featured = true WHERE id IN (SELECT id FROM lots LIMIT 5);")
