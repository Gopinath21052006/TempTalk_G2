import { getInitials, getUserColor } from '../../utils/helpers'

interface AvatarProps {
  name: string
  userId: string
  size?: 'sm' | 'md' | 'lg'
  showOnline?: boolean
}

const sizeMap = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
}

export function Avatar({ name, userId, size = 'md', showOnline }: AvatarProps) {
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`${sizeMap[size]} ${getUserColor(userId)} rounded-full flex items-center justify-center font-bold text-white select-none`}
      >
        {getInitials(name)}
      </div>
      {showOnline && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface-900" />
      )}
    </div>
  )
}
