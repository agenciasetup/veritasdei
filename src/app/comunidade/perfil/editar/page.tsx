import { redirect } from 'next/navigation'

// Edição foi unificada em /perfil com um sheet "Editar perfil". Mantemos
// este path para bookmarks antigos — redireciona e já abre o sheet.
export default function ProfileEditPage() {
  redirect('/perfil?edit=1')
}
