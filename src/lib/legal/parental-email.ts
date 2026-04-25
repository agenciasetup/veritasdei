import { sendEmail } from '@/lib/email/resend'
import {
  renderParentalConsentRequest,
  renderParentalConsentConfirmed,
} from '@/lib/email/templates/parental-consent'
import { buildConsentUrl } from '@/lib/legal/parental-token'

interface SendRequestArgs {
  parentEmail: string
  minorName: string
  token: string
  expiresAt: Date
  baseUrl: string
}

export async function sendParentalConsentRequestEmail(args: SendRequestArgs): Promise<{ id: string }> {
  const consentUrl = buildConsentUrl(args.baseUrl, args.token)
  const tpl = renderParentalConsentRequest({
    minorName: args.minorName,
    parentEmail: args.parentEmail,
    consentUrl,
    expiresAt: args.expiresAt,
  })
  return sendEmail({
    to: args.parentEmail,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: [{ name: 'kind', value: 'parental_consent_request' }],
  })
}

interface SendConfirmedArgs {
  parentEmail: string
  parentName?: string | null
  minorName: string
  minorEmail?: string | null
}

export async function sendParentalConsentConfirmedEmails(args: SendConfirmedArgs): Promise<void> {
  const tpl = renderParentalConsentConfirmed({
    minorName: args.minorName,
    parentName: args.parentName ?? null,
  })
  const recipients: string[] = [args.parentEmail]
  if (args.minorEmail && args.minorEmail.toLowerCase() !== args.parentEmail.toLowerCase()) {
    recipients.push(args.minorEmail)
  }
  await Promise.allSettled(
    recipients.map((to) =>
      sendEmail({
        to,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        tags: [{ name: 'kind', value: 'parental_consent_confirmed' }],
      }),
    ),
  )
}
