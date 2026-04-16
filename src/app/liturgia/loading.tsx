import { SkeletonCard, SkeletonHubTile, SkeletonText } from '@/components/mobile/Skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen pb-24">
      <header className="px-5 pt-16 pb-3">
        <SkeletonText width={180} height={32} />
        <div className="mt-2">
          <SkeletonText width={240} height={14} />
        </div>
      </header>
      <section className="px-4 mb-4">
        <SkeletonCard height={140} />
      </section>
      <section className="px-4 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonHubTile key={i} />
        ))}
      </section>
    </main>
  )
}
