import { RosaryPreview } from '@/features/rosario/preview/RosaryPreview'

// Temporary dev route for sprint 1.3. Will be removed/replaced in sprint 1.5
// when `<RosarySession />` takes over the main /rosario page.
export const metadata = {
  title: 'Preview do Terço — Veritas Dei',
  robots: { index: false, follow: false },
}

export default function RosarioPreviewPage() {
  return <RosaryPreview />
}
