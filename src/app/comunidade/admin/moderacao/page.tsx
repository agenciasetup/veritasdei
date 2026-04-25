import { permanentRedirect } from 'next/navigation'

export default function LegacyModerationRedirect() {
  permanentRedirect('/admin/moderacao')
}
