
-- Email SMTP settings (singleton, admin only)
CREATE TABLE public.email_smtp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host TEXT NOT NULL DEFAULT 'smtp.hostinger.com',
  port INTEGER NOT NULL DEFAULT 465,
  secure BOOLEAN NOT NULL DEFAULT true,
  username TEXT NOT NULL DEFAULT '',
  password TEXT NOT NULL DEFAULT '',
  from_email TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT 'NC Agro Leilões',
  reply_to TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_smtp_settings TO authenticated;
GRANT ALL ON public.email_smtp_settings TO service_role;
ALTER TABLE public.email_smtp_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage smtp" ON public.email_smtp_settings FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Email templates (admin manages, used by send fn)
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'transactional', -- 'auth' | 'transactional'
  subject TEXT NOT NULL DEFAULT '',
  header_html TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  footer_html TEXT NOT NULL DEFAULT '',
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.email_templates FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER trg_email_smtp_updated BEFORE UPDATE ON public.email_smtp_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_email_templates_updated BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Email send log
CREATE TABLE public.email_send_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT,
  to_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL, -- 'sent' | 'failed'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.email_send_logs TO authenticated;
GRANT ALL ON public.email_send_logs TO service_role;
ALTER TABLE public.email_send_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read logs" ON public.email_send_logs FOR SELECT TO authenticated
  USING (public.is_admin());

-- Seed default header/footer + templates
INSERT INTO public.email_smtp_settings (host, port, secure, from_name) VALUES
  ('smtp.hostinger.com', 465, true, 'NC Agro Leilões');

INSERT INTO public.email_templates (name, label, category, subject, header_html, body_html, footer_html, variables) VALUES
('signup_confirm', 'Confirmação de Cadastro', 'auth',
 'Confirme seu cadastro na NC Agro Leilões',
 '<div style="background:linear-gradient(135deg,#15803d,#166534);padding:24px;text-align:center;color:#fff;font-family:Arial,sans-serif;"><h1 style="margin:0;font-size:24px;"><span style="color:#fff;">NC </span><span style="color:#facc15;">Agro Leilões</span></h1></div>',
 '<div style="padding:32px;font-family:Arial,sans-serif;color:#1f2937;"><h2 style="color:#166534;">Olá {{name}}! 🎉</h2><p>Recebemos seu cadastro. Para ativar sua conta e dar lances, confirme seu e-mail:</p><p style="text-align:center;margin:28px 0;"><a href="{{confirm_url}}" style="background:#facc15;color:#1f2937;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;">Confirmar e-mail</a></p><p style="font-size:13px;color:#6b7280;">Se não foi você, ignore este e-mail.</p></div>',
 '<div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;border-top:1px solid #e5e7eb;">NC Agro Leilões · © 2026 NC Brasil</div>',
 '["name","confirm_url"]'::jsonb),
('password_reset', 'Recuperação de Senha', 'auth',
 'Redefina sua senha',
 '<div style="background:linear-gradient(135deg,#15803d,#166534);padding:24px;text-align:center;color:#fff;font-family:Arial,sans-serif;"><h1 style="margin:0;font-size:24px;"><span style="color:#fff;">NC </span><span style="color:#facc15;">Agro Leilões</span></h1></div>',
 '<div style="padding:32px;font-family:Arial,sans-serif;color:#1f2937;"><h2 style="color:#166534;">Redefinir senha 🔐</h2><p>Olá {{name}}, recebemos uma solicitação para redefinir sua senha.</p><p style="text-align:center;margin:28px 0;"><a href="{{reset_url}}" style="background:#facc15;color:#1f2937;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;">Redefinir senha</a></p><p style="font-size:13px;color:#6b7280;">O link expira em 1 hora. Se não foi você, ignore.</p></div>',
 '<div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;border-top:1px solid #e5e7eb;">NC Agro Leilões · © 2026 NC Brasil</div>',
 '["name","reset_url"]'::jsonb),
('magic_link', 'Magic Link', 'auth',
 'Seu link de acesso',
 '<div style="background:linear-gradient(135deg,#15803d,#166534);padding:24px;text-align:center;color:#fff;font-family:Arial,sans-serif;"><h1 style="margin:0;font-size:24px;"><span style="color:#fff;">NC </span><span style="color:#facc15;">Agro Leilões</span></h1></div>',
 '<div style="padding:32px;font-family:Arial,sans-serif;color:#1f2937;"><h2 style="color:#166534;">Acesso rápido ✨</h2><p>Clique no botão abaixo para entrar:</p><p style="text-align:center;margin:28px 0;"><a href="{{magic_url}}" style="background:#facc15;color:#1f2937;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;">Entrar</a></p></div>',
 '<div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;border-top:1px solid #e5e7eb;">NC Agro Leilões · © 2026 NC Brasil</div>',
 '["magic_url"]'::jsonb),
('account_approved', 'Cadastro Aprovado', 'transactional',
 'Seu cadastro foi aprovado!',
 '<div style="background:linear-gradient(135deg,#15803d,#166534);padding:24px;text-align:center;color:#fff;font-family:Arial,sans-serif;"><h1 style="margin:0;font-size:24px;"><span style="color:#fff;">NC </span><span style="color:#facc15;">Agro Leilões</span></h1></div>',
 '<div style="padding:32px;font-family:Arial,sans-serif;color:#1f2937;"><h2 style="color:#166534;">Parabéns, {{name}}! ✅</h2><p>Seu cadastro foi aprovado. Você já pode dar lances nos leilões.</p><p style="text-align:center;margin:28px 0;"><a href="{{site_url}}" style="background:#facc15;color:#1f2937;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;">Acessar plataforma</a></p></div>',
 '<div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;border-top:1px solid #e5e7eb;">NC Agro Leilões · © 2026 NC Brasil</div>',
 '["name","site_url"]'::jsonb),
('payment_confirmed', 'Pagamento Confirmado', 'transactional',
 'Pagamento confirmado ✓',
 '<div style="background:linear-gradient(135deg,#15803d,#166534);padding:24px;text-align:center;color:#fff;font-family:Arial,sans-serif;"><h1 style="margin:0;font-size:24px;"><span style="color:#fff;">NC </span><span style="color:#facc15;">Agro Leilões</span></h1></div>',
 '<div style="padding:32px;font-family:Arial,sans-serif;color:#1f2937;"><h2 style="color:#166534;">Pagamento recebido 💰</h2><p>Olá {{name}}, confirmamos seu pagamento de <strong>{{amount}}</strong> referente à parcela {{installment}}.</p><p>Obrigado!</p></div>',
 '<div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;border-top:1px solid #e5e7eb;">NC Agro Leilões · © 2026 NC Brasil</div>',
 '["name","amount","installment"]'::jsonb),
('lot_won', 'Lote Arrematado', 'transactional',
 'Parabéns! Você arrematou o lote {{lot_number}}',
 '<div style="background:linear-gradient(135deg,#15803d,#166534);padding:24px;text-align:center;color:#fff;font-family:Arial,sans-serif;"><h1 style="margin:0;font-size:24px;"><span style="color:#fff;">NC </span><span style="color:#facc15;">Agro Leilões</span></h1></div>',
 '<div style="padding:32px;font-family:Arial,sans-serif;color:#1f2937;"><h2 style="color:#166534;">Parabéns, {{name}}! 🏆</h2><p>Você arrematou o lote <strong>{{lot_number}}</strong> — {{lot_name}} por <strong>{{amount}}</strong>.</p><p style="text-align:center;margin:28px 0;"><a href="{{lot_url}}" style="background:#facc15;color:#1f2937;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;">Ver detalhes</a></p></div>',
 '<div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;border-top:1px solid #e5e7eb;">NC Agro Leilões · © 2026 NC Brasil</div>',
 '["name","lot_number","lot_name","amount","lot_url"]'::jsonb),
('bid_outbid', 'Lance Superado', 'transactional',
 'Seu lance foi superado',
 '<div style="background:linear-gradient(135deg,#15803d,#166534);padding:24px;text-align:center;color:#fff;font-family:Arial,sans-serif;"><h1 style="margin:0;font-size:24px;"><span style="color:#fff;">NC </span><span style="color:#facc15;">Agro Leilões</span></h1></div>',
 '<div style="padding:32px;font-family:Arial,sans-serif;color:#1f2937;"><h2 style="color:#166534;">Seu lance foi superado 📢</h2><p>Olá {{name}}, o lance no lote <strong>{{lot_number}}</strong> foi superado por <strong>{{new_amount}}</strong>.</p><p style="text-align:center;margin:28px 0;"><a href="{{lot_url}}" style="background:#facc15;color:#1f2937;padding:14px 32px;border-radius:8px;font-weight:700;text-decoration:none;">Voltar ao leilão</a></p></div>',
 '<div style="background:#f9fafb;padding:20px;text-align:center;font-size:12px;color:#6b7280;font-family:Arial,sans-serif;border-top:1px solid #e5e7eb;">NC Agro Leilões · © 2026 NC Brasil</div>',
 '["name","lot_number","new_amount","lot_url"]'::jsonb);
