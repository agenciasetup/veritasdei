type Severity = 'info' | 'warning' | 'critical'

interface AdminAlertOpts {
  severity: Severity
  title: string
  description?: string
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  payload?: Record<string, unknown>
}

const COLORS: Record<Severity, number> = {
  info: 0x3498db,
  warning: 0xc9a84c,
  critical: 0xe74c3c,
}

export async function sendAdminAlert(opts: AdminAlertOpts): Promise<void> {
  const url = process.env.ADMIN_ALERT_WEBHOOK_URL
  if (!url) {
    console.warn('[admin-alert] ADMIN_ALERT_WEBHOOK_URL não configurada — alerta ignorado:', opts.title)
    return
  }

  const fields = opts.fields ?? []
  if (opts.payload && Object.keys(opts.payload).length > 0) {
    const json = JSON.stringify(opts.payload, null, 2)
    fields.push({
      name: 'payload',
      value: '```json\n' + (json.length > 900 ? json.slice(0, 900) + '\n…(truncado)' : json) + '\n```',
    })
  }

  const body = {
    embeds: [
      {
        title: opts.title.slice(0, 240),
        description: opts.description?.slice(0, 1800),
        color: COLORS[opts.severity],
        timestamp: new Date().toISOString(),
        footer: { text: `VeritasDei • ${opts.severity.toUpperCase()}` },
        fields: fields.slice(0, 25),
      },
    ],
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 3000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    if (!res.ok) {
      console.error('[admin-alert] discord respondeu', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.error('[admin-alert] falhou', err)
  } finally {
    clearTimeout(timer)
  }
}
