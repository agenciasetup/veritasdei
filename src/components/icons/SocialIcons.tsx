import type { SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function InstagramIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  )
}

export function TikTokIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      <path d="M16.5 3a6.2 6.2 0 0 0 4.5 2.2v3.3a9.4 9.4 0 0 1-4.5-1.2v7.4a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v3.4a2.3 2.3 0 1 0 1.5 2.2V3Z" />
    </svg>
  )
}

export function YouTubeIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <rect x="2" y="5" width="20" height="14" rx="3.5" />
      <path d="M10 9.5 15 12l-5 2.5Z" fill="currentColor" stroke="currentColor" />
    </svg>
  )
}

export function WhatsAppIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d="M3.5 20.5 5 16a8 8 0 1 1 3 3l-4.5 1.5Z" />
      <path d="M8.5 9.5c.2 1.5 1.1 2.8 2.3 3.8s2.5 1.6 4 1.8l1.5-1.3-2-1.2-1.3 1-2-1-1-2 1-1.3-1.2-2-1.3 1.5Z" fill="currentColor" stroke="none" />
    </svg>
  )
}
