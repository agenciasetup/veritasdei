import EditorShell from '@/features/prayers/editor/EditorShell'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function EditorPage({ params }: PageProps) {
  const { id } = await params
  return <EditorShell prayerId={id} />
}
