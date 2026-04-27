INSERT INTO public.animals (
    name, breed, species, internal_code, registration_number, 
    birth_date, sex, color, weight, location, 
    description, youtube_url, photos, seller_id, category_id,
    genealogy
) VALUES 
(
    'Rei do Pasto', 'Nelore', 'Bovino', 'NEL001', 'REG-1001', 
    '2021-05-15', 'M', 'Branco', 850, 'Ribeirão Preto, SP',
    'Touro Nelore PO de alta linhagem, ideal para repasse e melhoramento genético.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1547448415-e9f5b28e570d', 'https://images.unsplash.com/photo-1594140062325-3b951474d2e5'],
    'f3e57a2c-39b1-4a4f-a90b-7ada2cff56aa', '556ae09c-ad3d-4d3d-810e-b6fe731656e5',
    '{"pai": "Grande Chefe", "mae": "Rainha Nelore", "avo_paterno": "Vencedor", "avo_materna": "Diva"}'
),
(
    'Black Diamond', 'Angus', 'Bovino', 'ANG002', 'REG-2002', 
    '2022-01-10', 'M', 'Preto', 720, 'Uberaba, MG',
    'Angus Aberden com excelente acabamento de carcaça e marmoreio.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1570042225831-d98fa7577f1e'],
    '79953a0b-c57f-4e50-9694-e18652a8f5c3', '556ae09c-ad3d-4d3d-810e-b6fe731656e5',
    '{"pai": "Black Gold", "mae": "Night Star", "avo_paterno": "Onyx", "avo_materna": "Shadow"}'
),
(
    'Estrela do Leite', 'Gir Leiteiro', 'Bovino', 'GIR003', 'REG-3003', 
    '2020-08-20', 'F', 'Chitado de Vermelho', 550, 'Uberaba, MG',
    'Vaca Gir Leiteira com produção aferida de 35kg/dia.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1545468844-329438258750'],
    '79953a0b-c57f-4e50-9694-e18652a8f5c3', '556ae09c-ad3d-4d3d-810e-b6fe731656e5',
    '{"pai": "Teatro da Silvania", "mae": "Cascata", "avo_paterno": "Sansão", "avo_materna": "Bailarina"}'
),
(
    'Trovão Negro', 'Manga-larga Marchador', 'Equino', 'MLM004', 'REG-4004', 
    '2019-11-05', 'M', 'Preto', 480, 'Belo Horizonte, MG',
    'Garanhão Manga-larga com marcha batida extremamente cômoda e diagrama perfeito.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1553284965-83fd3e82fa5a', 'https://images.unsplash.com/photo-1598974357851-98166a9d9b45'],
    '9614d868-ce94-457b-b288-05f5715101d5', '41525c71-f485-4910-aaa5-8ee7e85a6793',
    '{"pai": "Favorito", "mae": "Elegância", "avo_paterno": "Trilho da Zélia", "avo_materna": "Dádiva"}'
),
(
    'Red Bull', 'Senepol', 'Bovino', 'SEN005', 'REG-5005', 
    '2021-02-28', 'M', 'Vermelho', 780, 'Campo Grande, MS',
    'Senepol com excelente adaptabilidade térmica e precocidade sexual.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1500382017468-9049fed747ef'],
    'c9af2373-ce08-43ed-bab9-8b6c4d086d5c', '556ae09c-ad3d-4d3d-810e-b6fe731656e5',
    '{"pai": "Red Power", "mae": "Ruby", "avo_paterno": "Warrior", "avo_materna": "Gems"}'
),
(
    'Dairy Queen', 'Holandês', 'Bovino', 'HOL006', 'REG-6006', 
    '2021-07-12', 'F', 'Preto e Branco', 600, 'Goiânia, GO',
    'Novilha Holandesa de alta genética para produção leiteira industrial.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1563203369-26f2e4a5ccf7'],
    '21ec0973-c9ac-48d0-b481-466099a38d42', '556ae09c-ad3d-4d3d-810e-b6fe731656e5',
    '{"pai": "Milkman", "mae": "Creamy", "avo_paterno": "Boss", "avo_materna": "Lulu"}'
),
(
    'Brangus Master', 'Brangus', 'Bovino', 'BRG007', 'REG-7007', 
    '2022-03-30', 'M', 'Preto', 680, 'Ribeirão Preto, SP',
    'A união perfeita entre a resistência do Zebu e a qualidade do Angus.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1550524513-3bac710c24f2'],
    'f3e57a2c-39b1-4a4f-a90b-7ada2cff56aa', '556ae09c-ad3d-4d3d-810e-b6fe731656e5',
    '{"pai": "Cross", "mae": "Fusion", "avo_paterno": "Zeb", "avo_materna": "Angie"}'
),
(
    'Wagyu Gold', 'Wagyu', 'Bovino', 'WAG008', 'REG-8008', 
    '2023-01-05', 'M', 'Preto', 450, 'Campo Grande, MS',
    'Bezerro Wagyu com linhagem japonesa pura para produção de carne Kobe Beef.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1546445317-29f4545e9d53'],
    'c9af2373-ce08-43ed-bab9-8b6c4d086d5c', '556ae09c-ad3d-4d3d-810e-b6fe731656e5',
    '{"pai": "Kobe King", "mae": "Sakura", "avo_paterno": "Fuji", "avo_materna": "Zen"}'
),
(
    'Gigante Brahman', 'Brahman', 'Bovino', 'BRA009', 'REG-9009', 
    '2020-05-22', 'M', 'Cinza', 920, 'Goiânia, GO',
    'Touro Brahman de grande porte, excelente para cruzamentos industriais.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1516467508483-a7212febe31a'],
    '21ec0973-c9ac-48d0-b481-466099a38d42', '556ae09c-ad3d-4d3d-810e-b6fe731656e5',
    '{"pai": "Atlas", "mae": "Gaia", "avo_paterno": "Hercules", "avo_materna": "Rhea"}'
),
(
    'Guzerá Milenar', 'Guzerá', 'Bovino', 'GUZ010', 'REG-010', 
    '2021-09-15', 'F', 'Cinza Escuro', 580, 'Ribeirão Preto, SP',
    'Fêmea Guzerá PO com chifres característicos e excelente habilidade materna.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ARRAY['https://images.unsplash.com/photo-1527153371498-63457f59688d'],
    'f3e57a2c-39b1-4a4f-a90b-7ada2cff56aa', '556ae09c-ad3d-4d3d-810e-b6fe731656e5',
    '{"pai": "Soberano", "mae": "Majestade", "avo_paterno": "Líder", "avo_materna": "Nobreza"}'
);
