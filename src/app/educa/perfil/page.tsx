/**
 * /educa/perfil — redireciona pra /perfil.
 *
 * O perfil do Educa reusa o /perfil do Veritas full (com ProfileHeaderCard,
 * tabs, capa, avatar editor). A aba "Carteirinha" é escondida quando o
 * produto é veritas-educa. Mantemos este redirect por compatibilidade
 * com links antigos pra /educa/perfil.
 */

import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function EducaPerfilRedirect() {
  redirect('/perfil')
}
