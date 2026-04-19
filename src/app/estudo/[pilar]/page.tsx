import StudyPillarClient from '@/components/study/StudyPillarClient'

export default async function EstudoPilarPage({
  params,
}: {
  params: Promise<{ pilar: string }>
}) {
  const { pilar } = await params
  return <StudyPillarClient pillarSlug={pilar} />
}
