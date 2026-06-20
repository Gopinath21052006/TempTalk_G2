import { useNavigate } from 'react-router-dom'
import { MessageSquare, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 bg-surface-950">
      <div className="w-20 h-20 bg-surface-800/60 border border-surface-700 rounded-3xl flex items-center justify-center">
        <MessageSquare size={34} className="text-surface-600" />
      </div>
      <div className="text-center">
        <h1 className="text-5xl font-bold text-surface-200 mb-2">404</h1>
        <p className="text-surface-500">This page doesn't exist.</p>
      </div>
      <button onClick={() => navigate('/')} className="btn-primary">
        <ArrowLeft size={17} />
        Go Home
      </button>
    </div>
  )
}