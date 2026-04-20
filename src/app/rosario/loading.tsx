import { SkeletonCard, SkeletonText } from '@/components/mobile/Skeleton'

export default function Loading() {
  return (
    <main className="min-h-screen pb-24" style={{ background: 'var(--surface-1)' }}>
      <header className="px-5 pt-16 pb-3 text-center">
        <SkeletonText width={140} height={28} />
      </header>
      <section className="px-4 mt-6 flex flex-col gap-3">
        <SkeletonCard height={120} />
        <SkeletonCard height={120} />
      </section>
    </main>
  )
}
