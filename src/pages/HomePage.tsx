import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Plus, LogIn, Shield, Clock, Zap, Users, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useUser } from '../contexts/UserContext'
import { createRoom, findRoom, validateRoomPassword } from '../services/roomService'
import { generateUserId } from '../utils/helpers'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

type Mode = 'home' | 'create' | 'join'

const FEATURES = [
  { icon: Shield, label: 'Password Protected', desc: 'Private rooms' },
  { icon: Clock,  label: 'Auto-Expires',       desc: 'Gone in 1 hour' },
  { icon: Zap,    label: 'Realtime',            desc: 'Instant messages' },
  { icon: Users,  label: 'No Account',          desc: 'Just a name' },
]

export function HomePage() {
  const navigate = useNavigate()
  const { setSession } = useUser()
  const [mode, setMode] = useState<Mode>('home')
  const [loading, setLoading] = useState(false)

  const [createForm, setCreateForm] = useState({ displayName: '', roomName: '', password: '' })
  const [joinForm,   setJoinForm]   = useState({ displayName: '', roomName: '', password: '' })

  // ── Create ──────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const { displayName, roomName, password } = createForm

    if (!displayName.trim() || !roomName.trim() || !password.trim()) {
      toast.error('All fields are required')
      return
    }
    if (password.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }

    setLoading(true)
    try {
      const existing = await findRoom(roomName.trim())
      if (existing) {
        toast.error('A room with this name already exists')
        return
      }

      const userId = generateUserId()
      const room = await createRoom(roomName.trim(), password, userId, displayName.trim())

      setSession({ userId, displayName: displayName.trim() })
      navigate(`/room/${room.id}`)
      toast.success('Room created!')
    } catch {
      toast.error('Failed to create room — please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Join ────────────────────────────────────────────────────────────────
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { displayName, roomName, password } = joinForm

    if (!displayName.trim() || !roomName.trim() || !password.trim()) {
      toast.error('All fields are required')
      return
    }

    setLoading(true)
    try {
      const room = await findRoom(roomName.trim())
      if (!room) {
        toast.error('Room not found or has expired')
        return
      }

      if (!validateRoomPassword(room, password)) {
        toast.error('Incorrect password')
        return
      }

      const userId = generateUserId()
      setSession({ userId, displayName: displayName.trim() })
      navigate(`/room/${room.id}`)
      toast.success(`Joined ${room.name}!`)
    } catch {
      toast.error('Failed to join room — please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col">
      {/* Nav */}
      <nav className="px-5 py-4 border-b border-surface-800/50">
        <div className="max-w-5xl mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-md">
            <MessageSquare size={17} className="text-white" />
          </div>
          <span className="font-bold text-surface-100 tracking-tight">TempTalk</span>
          <span className="text-[10px] font-semibold bg-primary-500/15 text-primary-400 px-2 py-0.5 rounded-full border border-primary-500/20">
            G2
          </span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">

        {/* ── Landing ── */}
        {mode === 'home' && (
          <div className="w-full max-w-xl animate-slide-up">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-primary-500/10 border border-primary-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageSquare size={34} className="text-primary-400" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-surface-50 mb-3 tracking-tight">
                Chat without the{' '}
                <span className="text-gradient">baggage</span>
              </h1>
              <p className="text-surface-400 text-base sm:text-lg max-w-sm mx-auto leading-relaxed">
                Temporary group chats that vanish after an hour. No account, no trace.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <button
                onClick={() => setMode('create')}
                className="btn-primary text-base px-8 py-3.5 glow-primary"
              >
                <Plus size={20} />
                Create a Room
              </button>
              <button
                onClick={() => setMode('join')}
                className="btn-secondary text-base px-8 py-3.5"
              >
                <LogIn size={20} />
                Join a Room
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="card p-4 text-center hover:border-surface-700 transition-colors">
                  <Icon size={20} className="text-primary-400 mx-auto mb-2" />
                  <p className="text-surface-200 text-xs font-semibold">{label}</p>
                  <p className="text-surface-600 text-[11px] mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Create ── */}
        {mode === 'create' && (
          <div className="w-full max-w-sm animate-slide-up">
            <button onClick={() => setMode('home')} className="btn-ghost mb-5 text-sm -ml-1">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <Plus size={19} className="text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-surface-100">Create Room</h2>
                  <p className="text-surface-500 text-xs">Start a new chat room</p>
                </div>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wide">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Display name"
                    className="input-field"
                    value={createForm.displayName}
                    onChange={e => setCreateForm(f => ({ ...f, displayName: e.target.value }))}
                    maxLength={30}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wide">
                    Room Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. project-alpha"
                    className="input-field"
                    value={createForm.roomName}
                    onChange={e => setCreateForm(f => ({ ...f, roomName: e.target.value }))}
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Share this to invite others"
                    className="input-field"
                    value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : <Plus size={17} />}
                  {loading ? 'Creating…' : 'Create Room'}
                </button>
              </form>

              <p className="text-surface-700 text-[11px] text-center mt-4">
                Room expires automatically after 1 hour
              </p>
            </div>
          </div>
        )}

        {/* ── Join ── */}
        {mode === 'join' && (
          <div className="w-full max-w-sm animate-slide-up">
            <button onClick={() => setMode('home')} className="btn-ghost mb-5 text-sm -ml-1">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                  <LogIn size={19} className="text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-surface-100">Join Room</h2>
                  <p className="text-surface-500 text-xs">Enter your room credentials</p>
                </div>
              </div>

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wide">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="Display name"
                    className="input-field"
                    value={joinForm.displayName}
                    onChange={e => setJoinForm(f => ({ ...f, displayName: e.target.value }))}
                    maxLength={30}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wide">
                    Room Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter the room name"
                    className="input-field"
                    value={joinForm.roomName}
                    onChange={e => setJoinForm(f => ({ ...f, roomName: e.target.value }))}
                    maxLength={40}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-400 mb-1.5 uppercase tracking-wide">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Room password"
                    className="input-field"
                    value={joinForm.password}
                    onChange={e => setJoinForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn-primary w-full mt-1" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : <LogIn size={17} />}
                  {loading ? 'Joining…' : 'Join Room'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-10 text-center text-sm text-surface-500">
  <p>Built with React, TypeScript, Firebase & Cloudinary</p>
  <p className="mt-1">
    Developed by <span className="font-semibold text-primary-400">Gopinath R</span>
  </p>
</footer>
    </div>
  )
}
