# Melhorar acessibilidade e presença no Google

## Resultado
- Corrigir textos genéricos, descrições de imagens e nomes acessíveis em controles públicos.
- Publicar um guia útil sobre como investir em gado de elite, ligado à página inicial e à página Sobre.
- Adicionar dados estruturados de Evento, Produto e Artigo nas páginas correspondentes.
- Corrigir `robots.txt` e o sitemap para usarem `https://plataformaleiloesagro.site`.
- Validar a página inicial, eventos, lotes, notícias, guia, robots e sitemap antes de republicar.

## Implementação
1. **Acessibilidade e conteúdo**
   - Trocar “Saiba mais” e “Ler mais” por chamadas descritivas.
   - Adicionar nomes para leitores de tela aos botões apenas com ícones em lotes e leilão ao vivo.
   - Substituir descrições genéricas de imagens nas áreas públicas envolvidas.

2. **Guia do investidor agro**
   - Criar `/guia-investidor-agro` com benefícios, riscos, avaliação de animais, funcionamento dos leilões e próximos passos.
   - Usar apenas orientações educativas, sem promessas de rentabilidade.
   - Adicionar links contextuais na página inicial e na página Sobre.

3. **Dados estruturados**
   - Evento: nome, datas, local, descrição, imagem e situação.
   - Lote: animal, imagens, preço atual e disponibilidade.
   - Notícia: título, descrição, imagem e datas disponíveis.

4. **Rastreamento e sitemap**
   - Atualizar o endereço do sitemap em `robots.txt`.
   - Gerar todas as URLs do sitemap no domínio final e preservar datas reais de atualização.
   - Fazer a geração falhar claramente se uma fonte dinâmica falhar, evitando XML parcial.

5. **Google Search Console**
   - A conexão disponível não pode ser autorizada pela função atual do usuário no workspace.
   - Após um administrador conceder acesso ou conectar a conta, concluir verificação, adicionar a propriedade e enviar o sitemap.

## Validação
- Conferir a compilação automática e os registros de execução.
- Abrir os fluxos públicos em tamanhos desktop e celular.
- Confirmar JSON-LD no HTML, sitemap XML no domínio final e referência correta em `robots.txt`.
- Republicar as mudanças no site final.
