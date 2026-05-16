'use client'

import { useRouter } from 'next/navigation'
import { RosarySession } from '@/features/rosario/session/RosarySession'
import {
  thematicToMysteryGroup,
  type ThematicRosary,
} from '@/features/rosario/data/thematicRosaries'

/**
 * Wrapper client-side pra sessão de um terço temático.
 *
 * Converte o `ThematicRosary` num `MysteryGroup` compatível e injeta na
 * `<RosarySession>` via `customMysteryGroup`. A sessão se comporta como
 * uma solo session — sem grupo, sem persistência de histórico (o
 * `mystery_set` no DB é enum restrito).
 *
 * Ao sair (botão "Voltar"), navega de volta pro catálogo temático.
 */
export function ThematicSessionClient({ rosary }: { rosary: ThematicRosary }) {
  const router = useRouter()
  const mysteryGroup = thematicToMysteryGroup(rosary)

  return (
    <RosarySession
      customMysteryGroup={mysteryGroup}
      onExit={() => router.push('/rosario/tematicos')}
    />
  )
}
