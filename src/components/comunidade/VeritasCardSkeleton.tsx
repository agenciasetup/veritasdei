import { SkeletonAvatar, SkeletonText } from '@/components/mobile/Skeleton'

/**
 * Skeleton mimetizando o layout enxuto do VeritasCard.
 * Mesmas dimensões e spacing para evitar layout shift ao carregar.
 */
export default function VeritasCardSkeleton() {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: '0.5px solid rgba(242,237,228,0.08)',
      }}
    >
      <div className="flex items-start gap-3">
        <SkeletonAvatar size={36} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SkeletonText width={120} height={12} />
            <SkeletonText width={40} height={10} />
          </div>
          <SkeletonText width={80} height={10} />
          <div className="mt-3 space-y-2">
            <SkeletonText width="95%" height={12} />
            <SkeletonText width="78%" height={12} />
          </div>
          <div className="mt-4 flex items-center gap-6">
            <SkeletonText width={28} height={16} />
            <SkeletonText width={28} height={16} />
            <SkeletonText width={28} height={16} />
            <SkeletonText width={28} height={16} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function VeritasFeedSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <VeritasCardSkeleton key={i} />
      ))}
    </div>
  )
}
