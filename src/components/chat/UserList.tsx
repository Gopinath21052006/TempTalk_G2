import { X, UserMinus, Crown } from 'lucide-react'
import { ActiveUser } from '../../types'
import { Avatar } from '../ui/Avatar'

interface UserListProps {
  users: ActiveUser[]
  currentUserId: string
  ownerId: string
  isOwner: boolean
  onRemoveUser: (userId: string) => void
  onClose: () => void
}

export function UserList({
  users,
  currentUserId,
  ownerId,
  isOwner,
  onRemoveUser,
  onClose,
}: UserListProps) {
  const sorted = [...users].sort((a, b) => {
    // Owner first, then alphabetical
    if (a.userId === ownerId) return -1
    if (b.userId === ownerId) return 1
    return a.displayName.localeCompare(b.displayName)
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-800">
        <div>
          <h3 className="font-semibold text-surface-100 text-sm">Members</h3>
          <p className="text-[11px] text-surface-500 mt-0.5">
            {users.length} online
          </p>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close user list">
          <X size={17} />
        </button>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {sorted.map(user => {
          const isMe = user.userId === currentUserId
          const isRoomOwner = user.userId === ownerId

          return (
            <div
              key={user.userId}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-surface-800/60 group transition-colors"
            >
              <Avatar name={user.displayName} userId={user.userId} size="sm" showOnline />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-surface-200 truncate">
                    {user.displayName}
                  </p>
                  {isRoomOwner && (
                    <Crown size={11} className="text-yellow-400 flex-shrink-0" />
                  )}
                  {isMe && (
                    <span className="text-[10px] text-primary-400 font-medium">(you)</span>
                  )}
                </div>
              </div>

              {/* Remove button — owner only, not self */}
              {isOwner && !isMe && (
                <button
                  onClick={() => onRemoveUser(user.userId)}
                  className="opacity-0 group-hover:opacity-100 btn-ghost p-1 text-red-400 hover:text-red-300 transition-all"
                  title={`Remove ${user.displayName}`}
                >
                  <UserMinus size={14} />
                </button>
              )}
            </div>
          )
        })}

        {users.length === 0 && (
          <p className="text-surface-600 text-sm text-center py-10">No users online</p>
        )}
      </div>
    </div>
  )
}
