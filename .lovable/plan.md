# Reativar o sistema no Lovable Cloud

## Entrega
- Reaplicar a estrutura de dados exigida pelo sistema atual, incluindo perfis, permissões separadas, vendedores, animais, eventos, lotes, lances, pagamentos, notificações, conteúdo e configurações.
- Preservar as regras de acesso existentes e garantir que cada conta veja e altere apenas o que sua função permite.
- Manter o cadastro e login por e-mail/senha e Google, com criação automática do perfil necessário ao sistema.
- Restaurar dados demonstrativos coerentes para eventos futuros, animais, lotes, notícias e configurações públicas.
- Atualizar a aplicação para usar a nova conexão gerenciada pelo Lovable Cloud sem inserir chaves manualmente.

## Validação
- Confirmar que as tabelas, permissões e dados demonstrativos foram criados.
- Validar cadastro/login, carregamento da página inicial, listagem de eventos e leitura dos lotes.
- Validar que um usuário autenticado consegue chegar ao fluxo de lance e que acessos administrativos continuam protegidos.
- Verificar os diagnósticos de segurança e de compilação ao final.

## Observação
- Nenhuma senha antiga pode ser recuperada. As contas antigas não existem no novo ambiente; novos usuários poderão se cadastrar e administradores poderão redefinir acessos pelo painel do Lovable Cloud.
