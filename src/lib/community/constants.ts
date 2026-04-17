export const VERITAS_MAX_BODY = 1000
export const VERITAS_MAX_MEDIA = 6
export const VERITAS_MAX_GIF_BYTES = 8 * 1024 * 1024
export const VERITAS_MAX_IMAGE_BYTES = 15 * 1024 * 1024
export const VERITAS_MAX_REASONS = 160
export const VERITAS_MAX_REPORT_DETAILS = 1000
export const VERITAS_DEFAULT_PAGE_SIZE = 20
export const VERITAS_MAX_PAGE_SIZE = 40
export const VERITAS_AUTO_HIDE_REPORT_THRESHOLD = 5

export const MEDIA_VARIANTS = {
  thumb: 'width=120,height=120,fit=cover,quality=60,format=auto',
  feed: 'width=1080,fit=scale-down,quality=72,format=auto',
  detail: 'width=1600,fit=scale-down,quality=78,format=auto',
  gifPreview: 'width=1080,fit=scale-down,quality=72,format=auto,anim=false',
} as const
