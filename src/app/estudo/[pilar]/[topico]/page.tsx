import StudyPillarClient from '@/components/study/StudyPillarClient'

export default async function EstudoPilarTopicoPage({
  params,
}: {
  params: Promise<{ pilar: string; topico: string }>
}) {
  const { pilar, topico } = await params
  return <StudyPillarClient pillarSlug={pilar} topicSlug={topico} />
}
