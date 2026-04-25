interface Args {
  displayName?: string | null
  scheduledFor: Date
  cancelUrl: string
}

const BRAND = '#C9A84C'
const BG = '#0f1115'
const SURFACE = '#15171c'
const TEXT = '#e9eaed'
const MUTED = '#9aa0a6'

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(d)
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderDeletionWarning(args: Args): {
  subject: string
  html: string
  text: string
} {
  const subject = 'Sua conta VeritasDei será excluída em 5 dias'
  const when = fmtDate(args.scheduledFor)
  const greeting = args.displayName ? `Olá, ${escapeHtml(args.displayName)}.` : 'Olá.'

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif;color:${TEXT};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BG};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${SURFACE};border-radius:14px;overflow:hidden;">
        <tr><td style="padding:28px 32px 12px;border-bottom:1px solid #20232a;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${BRAND};letter-spacing:.04em;">VeritasDei</div>
          <div style="font-size:12px;color:${MUTED};margin-top:4px;">Lembrete de exclusão de conta</div>
        </td></tr>
        <tr><td style="padding:28px 32px;font-size:15px;line-height:1.55;">
          <p style="margin:0 0 14px;">${greeting}</p>
          <p style="margin:0 0 14px;">
            Faltam <strong>5 dias</strong> para a exclusão definitiva da sua conta no VeritasDei.
            Conforme você solicitou, a remoção está agendada para <strong>${when}</strong>.
          </p>
          <p style="margin:0 0 18px;">
            Após essa data: cartas, intenções, mídia, preferências e dados pessoais serão removidos de forma permanente
            (publicações públicas serão anonimizadas, mantendo o histórico da comunidade conforme nossos termos).
          </p>
          <p style="margin:0 0 22px;">
            <a href="${args.cancelUrl}" style="display:inline-block;background:${BRAND};color:#1a1505;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">
              Cancelar exclusão
            </a>
          </p>
          <p style="margin:0;font-size:13px;color:${MUTED};">
            Se a exclusão foi intencional e você prefere antecipar, basta ignorar este e-mail.
          </p>
        </td></tr>
        <tr><td style="padding:18px 32px 28px;border-top:1px solid #20232a;font-size:12px;color:${MUTED};">
          Este lembrete cumpre o princípio da proporcionalidade da LGPD para que você tenha chance de reconsiderar.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  const text =
    `VeritasDei — Sua conta será excluída em 5 dias\n\n` +
    `${greeting.replace(/&nbsp;/g, ' ')}\n` +
    `A remoção definitiva da sua conta está agendada para ${when}.\n\n` +
    `Para cancelar, abra: ${args.cancelUrl}\n\n` +
    `Se a exclusão foi intencional, basta ignorar este e-mail.`

  return { subject, html, text }
}
