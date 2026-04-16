import { SkeletonAvatar, SkeletonCard, SkeletonText } from '@/components/mobile/Skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen pb-24">
      <header className="px-5 pt-16 pb-3 flex items-center gap-4">
        <SkeletonAvatar size={64} />
        <div className="flex-1">
          <SkeletonText width="60%" height={20} />
          <div className="mt-2">
            <SkeletonText width="40%" height={12} />
          </div>
        </div>
      </header>
      <section className="px-4 flex flex-col gap-2 mt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} height={64} rounded={16} />
        ))}
      </section>
    </main>
  )
}
