# Corrigir erros da página inicial

## Objetivo
Eliminar as falhas causadas por respostas nulas no carregamento e confirmar que o banner inicial não usa variáveis inexistentes.

## Alterações
- Tornar o tratamento das consultas da página inicial seguro quando uma resposta concluída vier nula ou incompleta.
- Garantir valores padrão para listas e configurações antes da renderização.
- Verificar o banner atual e remover qualquer referência fora de escopo, se encontrada.
- Validar a página inicial no navegador e conferir os diagnósticos finais.

## Observação técnica
Os caminhos `src/pages/Home.tsx` e `src/components/Hero.tsx` do relatório não existem nesta versão do projeto. A implementação equivalente está em `src/routes/index.tsx` e `src/components/site/HomeTemplates.tsx`.
