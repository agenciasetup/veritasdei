import {
  Bell,
  BookOpenText,
  Church,
  Compass,
  Cross,
  Crown,
  Droplets,
  Flame,
  HandHeart,
  Heart,
  Lightbulb,
  Moon,
  Shield,
  ShieldCheck,
  Sparkles,
  Sunrise,
  type LucideIcon,
} from 'lucide-react'

/**
 * Resolve `icon_name` vindo do banco para um componente Lucide.
 * Mantém a lista fechada pra evitar importar o pacote inteiro.
 * Se o nome não existir, cai no fallback (BookOpenText).
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Bell,
  BookOpenText,
  Church,
  Compass,
  Cross,
  Crown,
  Droplets,
  Flame,
  HandHeart,
  Heart,
  Lightbulb,
  Moon,
  Shield,
  ShieldCheck,
  Sparkles,
  Sunrise,
}

export function resolvePrayerIcon(name: string | null | undefined): LucideIcon {
  if (!name) return BookOpenText
  return ICON_MAP[name] ?? BookOpenText
}
