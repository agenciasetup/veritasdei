interface RequestArgs {
  minorName: string
  parentEmail: string
  consentUrl: string
  expiresAt: Date
}

interface ConfirmedArgs {
  minorName: string
  parentName?: string | null
}

const BRAND = '#C9A84C'
const BG = '#0f1115'
const SURFACE = '#15171c'
const TEXT = '#e9eaed'
const MUTED = '#9aa0a6'

function fmtDate(d: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(d)
}

function shell(title: string, inner: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:${BG};font-family:'Helvetica Neue',Arial,sans-serif;color:${TEXT};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BG};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:${SURFACE};border-radius:14px;overflow:hidden;">
        <tr><td style="padding:28px 32px 12px;border-bottom:1px solid #20232a;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${BRAND};letter-spacing:.04em;">VeritasDei</div>
          <div style="font-size:12px;color:${MUTED};margin-top:4px;">Devocional + comunidade católica</div>
        </td></tr>
        <tr><td style="padding:28px 32px;font-size:15px;line-height:1.55;">
          ${inner}
        </td></tr>
        <tr><td style="padding:18px 32px 28px;border-top:1px solid #20232a;font-size:12px;color:${MUTED};">
          Você recebeu este e-mail porque foi indicado como responsável legal de um cadastro no VeritasDei.<br>
          Se não reconhece, ignore — nenhuma conta será ativada sem sua confirmação.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export function renderParentalConsentRequest(args: RequestArgs): {
  subject: string
  html: string
  text: string
} {
  const subject = `Confirmação de responsável — VeritasDei (cadastro de ${args.minorName})`
  const expires = fmtDate(args.expiresAt)

  const html = shell(
    subject,
    `
    <p style="margin:0 0 14px;">Olá,</p>
    <p style="margin:0 0 14px;">
      Um cadastro em nome de <strong>${escapeHtml(args.minorName)}</strong> foi iniciado no VeritasDei e indicou
      <strong>${escapeHtml(args.parentEmail)}</strong> como e-mail do responsável legal.
    </p>
    <p style="margin:0 0 18px;">
      Para que o adolescente possa acessar a comunidade, precisamos da sua confirmação como pai, mãe,
      tutor ou responsável legal — exigência do <em>ECA</em> e da <em>LGPD</em> para usuários entre 14 e 17 anos.
    </p>
    <p style="margin:0 0 22px;">
      <a href="${args.consentUrl}" style="display:inline-block;background:${BRAND};color:#1a1505;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:8px;">
        Confirmar como responsável
      </a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:${MUTED};">
      O link expira em <strong>${expires}</strong> (horário de Brasília). Se ele expirar, o adolescente poderá solicitar um novo a partir do app.
    </p>
    <p style="margin:18px 0 0;font-size:13px;color:${MUTED};">
      Não foi você quem solicitou? Apenas ignore. A conta permanece bloqueada sem sua confirmação.
    </p>
  `,
  )

  const text =
    `VeritasDei — Confirmação de responsável\n\n` +
    `Um cadastro em nome de ${args.minorName} indicou ${args.parentEmail} como responsável legal.\n\n` +
    `Para confirmar, abra: ${args.consentUrl}\n\n` +
    `O link expira em ${expires} (horário de Brasília).\n\n` +
    `Se você não reconhece, ignore — a conta não será ativada sem sua confirmação.`

  return { subject, html, text }
}

export function renderParentalConsentConfirmed(args: ConfirmedArgs): {
  subject: string
  html: string
  text: string
} {
  const subject = `Cadastro confirmado — VeritasDei`
  const greeting = args.parentName ? `Olá, ${escapeHtml(args.parentName)}.` : 'Olá.'

  const html = shell(
    subject,
    `
    <p style="margin:0 0 14px;">${greeting}</p>
    <p style="margin:0 0 14px;">
      Confirmamos a sua autorização como responsável legal de <strong>${escapeHtml(args.minorName)}</strong> no VeritasDei.
    </p>
    <p style="margin:0 0 14px;">
      A conta agora está ativa, sob as <a href="https://veritasdei.com.br/diretrizes" style="color:${BRAND};">diretrizes da comunidade</a>
      e os <a href="https://veritasdei.com.br/termos" style="color:${BRAND};">termos de uso</a>.
    </p>
    <p style="margin:0 0 14px;font-size:13px;color:${MUTED};">
      Você pode revogar essa autorização a qualquer momento entrando em contato pelo
      <a href="mailto:contato@agenciasetup.com.br" style="color:${BRAND};">contato@agenciasetup.com.br</a>.
    </p>
  `,
  )

  const text =
    `VeritasDei — Cadastro confirmado\n\n` +
    `${greeting.replace(/&nbsp;/g, ' ')}\n` +
    `Confirmamos sua autorização como responsável legal de ${args.minorName}. A conta está ativa.\n\n` +
    `Para revogar a autorização, escreva para contato@agenciasetup.com.br.`

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
