import { MessageSquare } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} ${className} rounded-full border-primary-500 border-t-transparent animate-spin`}
    />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-950">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-[3px] border-primary-500/20 border-t-primary-500 animate-spin" />
        <MessageSquare
          size={20}
          className="text-primary-400 absolute inset-0 m-auto"
        />
      </div>
      <p className="text-surface-500 text-sm tracking-wide">Loading…</p>
    </div>
  )
}
