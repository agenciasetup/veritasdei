import CollapsibleHeader from '@/components/mobile/CollapsibleHeader'

interface HubHeaderProps {
  title: string
  subtitle?: string
}

/**
 * Header padrão dos hubs (`/orar`, `/liturgia`, `/aprender`).
 *
 * Mobile: usa CollapsibleHeader com large title que colapsa ao scrollar.
 * Desktop: cai no estilo Cormorant grande padrão (sem sticky bar).
 */
export default function HubHeader({ title, subtitle }: HubHeaderProps) {
  return <CollapsibleHeader title={title} subtitle={subtitle} />
}
