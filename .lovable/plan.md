# Corrigir falhas de listagem na página inicial

## Objetivo
Impedir que configurações com formato incorreto interrompam a página inicial.

## Alterações
- Normalizar listas do banner e a ordem das seções antes de usar `map`.
- Normalizar configurações recebidas para evitar referências inválidas.
- Preservar conteúdo padrão quando algum valor estiver ausente ou incorreto.
- Validar a página inicial no navegador e conferir os diagnósticos finais.

## Observação técnica
O arquivo antigo `src/pages/Landing.tsx` não existe nesta versão. A página equivalente atual usa `src/routes/index.tsx` e os elementos do banner em `src/components/site/HomeTemplates.tsx`.
