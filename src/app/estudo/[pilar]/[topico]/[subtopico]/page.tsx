import StudyPillarClient from '@/components/study/StudyPillarClient'

export default async function EstudoSubtopicoPage({
  params,
}: {
  params: Promise<{ pilar: string; topico: string; subtopico: string }>
}) {
  const { pilar, topico, subtopico } = await params
  return (
    <StudyPillarClient
      pillarSlug={pilar}
      topicSlug={topico}
      subtopicSlug={subtopico}
    />
  )
}
