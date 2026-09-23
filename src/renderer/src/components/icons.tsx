import type { FC } from 'react'

interface IconProps {
  className?: string
}

export const StarIcon: FC<IconProps & { filled: boolean }> = ({ className, filled }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.6}
  >
    <path d="M10 2.5l2.3 4.86 5.2.75-3.76 3.73.89 5.26L10 14.6l-4.63 2.5.89-5.26-3.76-3.73 5.2-.75L10 2.5z" />
  </svg>
)

export const MoreIcon: FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="4.5" r="1.6" />
    <circle cx="10" cy="10" r="1.6" />
    <circle cx="10" cy="15.5" r="1.6" />
  </svg>
)

export const CheckIcon: FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const GridIcon: FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <rect x="2.5" y="2.5" width="6" height="6" rx="1.5" />
    <rect x="11.5" y="2.5" width="6" height="6" rx="1.5" />
    <rect x="2.5" y="11.5" width="6" height="6" rx="1.5" />
    <rect x="11.5" y="11.5" width="6" height="6" rx="1.5" />
  </svg>
)

export const ClockIcon: FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <circle cx="10" cy="10" r="7.3" />
    <path d="M10 6v4.2l3 1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const SearchIcon: FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7}>
    <circle cx="8.8" cy="8.8" r="5.6" />
    <path d="M17 17l-4.2-4.2" strokeLinecap="round" />
  </svg>
)

export const GearIcon: FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
    <circle cx="10" cy="10" r="2.6" />
    <path
      strokeLinecap="round"
      d="M10 2.8v1.9M10 15.3v1.9M17.2 10h-1.9M4.7 10H2.8M14.9 5.1l-1.3 1.3M6.4 13.6l-1.3 1.3M14.9 14.9l-1.3-1.3M6.4 6.4L5.1 5.1"
    />
  </svg>
)

export const CloseIcon: FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8}>
    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
  </svg>
)

export const DownloadIcon: FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.7}>
    <path d="M10 3v9.5M6 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 15.5v.8a1.7 1.7 0 0 0 1.7 1.7h8.6a1.7 1.7 0 0 0 1.7-1.7v-.8" strokeLinecap="round" />
  </svg>
)

export const VaultMarkIcon: FC<IconProps> = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20">
    <path
      fill="currentColor"
      d="M0 4.4A4.4 4.4 0 0 1 4.4 0h11.2A4.4 4.4 0 0 1 20 4.4v6.94L11.34 20H4.4A4.4 4.4 0 0 1 0 15.6V4.4z"
    />
    <path fill="currentColor" opacity="0.45" d="M20 11.34 11.34 20 20 11.34z" />
  </svg>
)
