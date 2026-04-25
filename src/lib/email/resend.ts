interface SendEmailOpts {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  tags?: Array<{ name: string; value: string }>
}

interface ResendResponse {
  id: string
}

export async function sendEmail(opts: SendEmailOpts): Promise<ResendResponse> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    throw new Error('email_provider_misconfigured: RESEND_API_KEY ou RESEND_FROM_EMAIL ausente')
  }

  const body: Record<string, unknown> = {
    from,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  }
  if (opts.replyTo) body.reply_to = opts.replyTo
  if (opts.tags) body.tags = opts.tags

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`resend_${res.status}: ${errBody.slice(0, 400)}`)
  }
  return (await res.json()) as ResendResponse
}
