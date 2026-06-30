import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

async function sendViaSMTP(args: {
  to: string;
  subject: string;
  html: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cfg } = await supabaseAdmin
    .from("email_smtp_settings")
    .select("*")
    .limit(1)
    .single();

  if (!cfg) throw new Error("Configuração SMTP não encontrada.");
  if (!cfg.enabled) throw new Error("Envio de e-mails está desativado no painel.");
  if (!cfg.host || !cfg.username || !cfg.password || !cfg.from_email) {
    throw new Error("SMTP incompleto: host, usuário, senha e remetente são obrigatórios.");
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.username, pass: cfg.password },
  });

  await transporter.sendMail({
    from: `"${cfg.from_name}" <${cfg.from_email}>`,
    to: args.to,
    replyTo: cfg.reply_to || undefined,
    subject: args.subject,
    html: args.html,
  });
}

async function logSend(row: {
  template_name: string | null;
  to_email: string;
  subject: string;
  status: "sent" | "failed";
  error_message?: string | null;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("email_send_logs").insert(row);
  } catch {
    /* ignore log errors */
  }
}

export const sendEmailByTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      templateName: string;
      to: string;
      variables?: Record<string, string>;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");

    const { data: tpl, error } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("name", data.templateName)
      .single();
    if (error || !tpl) throw new Error("Template não encontrado: " + data.templateName);
    if (!tpl.enabled) throw new Error("Template desativado.");

    const vars = data.variables ?? {};
    const subject = renderTemplate(tpl.subject, vars);
    const html =
      renderTemplate(tpl.header_html, vars) +
      renderTemplate(tpl.body_html, vars) +
      renderTemplate(tpl.footer_html, vars);

    try {
      await sendViaSMTP({ to: data.to, subject, html });
      await logSend({
        template_name: data.templateName,
        to_email: data.to,
        subject,
        status: "sent",
      });
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      await logSend({
        template_name: data.templateName,
        to_email: data.to,
        subject,
        status: "failed",
        error_message: msg,
      });
      throw new Error("Falha no envio: " + msg);
    }
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { to: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("is_admin");
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");

    const subject = "Teste de SMTP — NC Agro Leilões";
    const html =
      '<div style="font-family:Arial,sans-serif;padding:24px;">' +
      '<h2 style="color:#166534;">✅ SMTP funcionando!</h2>' +
      "<p>Este é um e-mail de teste enviado pelo painel administrativo.</p>" +
      "</div>";
    try {
      await sendViaSMTP({ to: data.to, subject, html });
      await logSend({
        template_name: "__test__",
        to_email: data.to,
        subject,
        status: "sent",
      });
      return { success: true };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      await logSend({
        template_name: "__test__",
        to_email: data.to,
        subject,
        status: "failed",
        error_message: msg,
      });
      throw new Error(msg);
    }
  });