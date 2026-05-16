/**
 * /educa/inicio — alias legado.
 *
 * A "Início" do Educa agora vive em /educa direto. Mantemos este path
 * só pra não quebrar bookmarks e links externos antigos.
 */

import { redirect } from 'next/navigation'

export default function EducaInicioPage() {
  redirect('/educa')
}
