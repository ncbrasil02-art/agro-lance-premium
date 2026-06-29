# Templates de E-mail — NC Agro Leilões

Cole cada arquivo no painel do Supabase em **Authentication → Email Templates**:

- `confirm-signup.html` → "Confirm signup"
- `reset-password.html` → "Reset Password"
- `magic-link.html` → "Magic Link" (opcional)
- `email-change.html` → "Change Email Address"
- `invite.html` → "Invite user"

Variáveis usadas pelo Supabase: `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .Email }}`, `{{ .SiteURL }}`.

Cabeçalho/rodapé padronizados estão embutidos em cada template para máxima compatibilidade
com clientes de e-mail (Gmail, Outlook, Apple Mail). NÃO use `<style>` externo nem CSS de página.