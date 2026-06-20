import { useState } from 'react'
import {
  Users,
  Clock,
  MoreVertical,
  LogOut,
  Trash2,
  KeyRound,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import { Room } from '../../types'
import { useCountdown } from '../../hooks/useCountdown'
import { Modal } from '../ui/Modal'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface RoomHeaderProps {
  room: Room
  onlineCount: number
  currentUserId: string
  onLeave: () => void
  onClose: () => Promise<void>
  onChangePassword: (newPassword: string) => Promise<void>
  onToggleUserList: () => void
}

export function RoomHeader({
  room,
  onlineCount,
  currentUserId,
  onLeave,
  onClose,
  onChangePassword,
  onToggleUserList,
}: RoomHeaderProps) {
  const { countdown, isExpired } = useCountdown(room.expiresAt)

  const [showMenu, setShowMenu] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const isOwner = room.ownerId === currentUserId

  // Countdown urgency colour
  const countdownClass = isExpired
    ? 'text-red-400'
    : countdown.startsWith('0m') || countdown.startsWith('1m') || countdown.startsWith('2m')
    ? 'text-orange-400'
    : 'text-surface-500'

  const handleChangePassword = async () => {
    if (newPassword.length < 4) return
    setLoading(true)
    try {
      await onChangePassword(newPassword)
      setNewPassword('')
      setShowPasswordModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = async () => {
    setLoading(true)
    try {
      await onClose()
    } finally {
      setLoading(false)
      setShowCloseModal(false)
    }
  }

  return (
    <>
      {/* ── Header bar ──────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-surface-800 bg-surface-900/95 backdrop-blur-sm z-10">
        {/* Logo mark */}
        <div className="w-8 h-8 bg-primary-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
          <MessageSquare size={16} className="text-primary-400" />
        </div>

        {/* Room name + timer */}
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-surface-100 truncate leading-tight">{room.name}</h1>
          <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${countdownClass}`}>
            <Clock size={10} />
            <span>{isExpired ? 'Expired' : `Expires in ${countdown}`}</span>
          </div>
        </div>

        {/* Online count */}
        <button
          onClick={onToggleUserList}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-surface-800 transition-colors"
          aria-label="Toggle user list"
        >
          <span className="online-dot" />
          <span className="text-sm font-medium text-surface-300">{onlineCount}</span>
          <Users size={14} className="text-surface-500" />
        </button>

        {/* Overflow menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="btn-ghost p-2 rounded-xl"
            aria-label="Room options"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-11 z-20 card p-1.5 w-52 shadow-2xl animate-slide-up border-surface-700/60">
                {isOwner && (
                  <>
                    <button
                      className="btn-ghost w-full justify-start text-sm px-3 py-2.5"
                      onClick={() => { setShowPasswordModal(true); setShowMenu(false) }}
                    >
                      <KeyRound size={15} className="text-surface-400" />
                      Change Password
                    </button>
                    <button
                      className="btn-danger w-full justify-start text-sm px-3 py-2.5 mt-0.5"
                      onClick={() => { setShowCloseModal(true); setShowMenu(false) }}
                    >
                      <Trash2 size={15} />
                      Close Room
                    </button>
                    <div className="my-1.5 border-t border-surface-800" />
                  </>
                )}
                <button
                  className="btn-ghost w-full justify-start text-sm px-3 py-2.5 text-red-400 hover:text-red-300"
                  onClick={() => { onLeave(); setShowMenu(false) }}
                >
                  <LogOut size={15} />
                  Leave Room
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Close-room modal ────────────────────────────── */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Close Room"
      >
        <p className="text-surface-400 text-sm mb-5 leading-relaxed">
          This will permanently delete the room and all messages for everyone. This action
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={() => setShowCloseModal(false)}>
            Cancel
          </button>
          <button className="btn-danger flex-1" onClick={handleClose} disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : <Trash2 size={15} />}
            Close Room
          </button>
        </div>
      </Modal>

      {/* ── Change-password modal ───────────────────────── */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setNewPassword('') }}
        title="Change Password"
      >
        <div className="space-y-4">
          <input
            type="password"
            placeholder="New password (min. 4 characters)"
            className="input-field"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleChangePassword() }}
            autoFocus
          />
          <div className="flex gap-3">
            <button
              className="btn-secondary flex-1"
              onClick={() => { setShowPasswordModal(false); setNewPassword('') }}
            >
              Cancel
            </button>
            <button
              className="btn-primary flex-1"
              onClick={handleChangePassword}
              disabled={loading || newPassword.length < 4}
            >
              {loading ? <LoadingSpinner size="sm" /> : <ChevronRight size={16} />}
              Update
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
