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
