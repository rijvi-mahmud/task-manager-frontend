import { cn } from '../../utils/cn'

const AVATAR_BACKGROUND_CLASSES = [
  'bg-neutral-700',
  'bg-neutral-600',
  'bg-neutral-800',
  'bg-neutral-900',
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

interface AvatarProps {
  name: string
  decorative?: boolean
  /** Stable number (e.g. an id) so each person keeps the same color. */
  seed: number
  size?: 'sm' | 'md'
  className?: string
}

export function Avatar({ name, seed, decorative = false, size = 'sm', className }: AvatarProps) {
  return (
    <span
      title={name}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-xs',
        AVATAR_BACKGROUND_CLASSES[Math.abs(seed) % AVATAR_BACKGROUND_CLASSES.length],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
