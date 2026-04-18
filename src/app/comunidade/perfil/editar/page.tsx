import { redirect } from 'next/navigation'

// Edição de perfil foi unificada em /perfil. Mantemos este path apenas
// para bookmarks e links antigos — redireciona direto para a seção
// Comunidade dentro do editor único.
export default function ProfileEditPage() {
  redirect('/perfil?tab=editar&section=comunidade')
}
