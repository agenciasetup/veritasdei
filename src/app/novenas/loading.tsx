import { SkeletonCard, SkeletonText } from '@/components/mobile/Skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen pb-24">
      <header className="px-5 pt-16 pb-3">
        <SkeletonText width={180} height={32} />
      </header>
      <section className="px-4 flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} height={88} rounded={16} />
        ))}
      </section>
    </main>
  )
}
