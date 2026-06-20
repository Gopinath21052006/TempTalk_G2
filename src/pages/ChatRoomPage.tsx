import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { MessageSquare } from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { subscribeToRoom, closeRoom, updateRoomPassword } from '../services/roomService'
import {
  subscribeToMessages,
  sendTextMessage,
  sendImageMessage,
  sendFileMessage,
  sendAudioMessage,
} from '../services/messageService'
import { leaveRoom } from '../services/presenceService'
import { usePresence } from '../hooks/usePresence'
import { Room, Message, ActiveUser } from '../types'
import { RoomHeader } from '../components/chat/RoomHeader'
import { MessageBubble } from '../components/chat/MessageBubble'
import { MessageInput } from '../components/chat/MessageInput'
import { TypingIndicator } from '../components/chat/TypingIndicator'
import { UserList } from '../components/chat/UserList'
import { PageLoader } from '../components/ui/LoadingSpinner'

export function ChatRoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { session } = useUser()

  const [room, setRoom] = useState<Room | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserList, setShowUserList] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isFirstLoadRef = useRef(true)

  const userId = session?.userId ?? ''
  const displayName = session?.displayName ?? 'Guest'

  // Redirect if no session
  useEffect(() => {
    if (!session) navigate('/')
  }, [session, navigate])

  // Subscribe to room
  useEffect(() => {
    if (!roomId) return

    const unsub = subscribeToRoom(roomId, updatedRoom => {
      if (!updatedRoom) {
        toast('Room has ended or expired.', { icon: '⏰' })
        navigate('/')
        return
      }
      setRoom(updatedRoom)
      setLoading(false)
    })

    return unsub
  }, [roomId, navigate])

  // Subscribe to messages
  useEffect(() => {
    if (!roomId) return
    return subscribeToMessages(roomId, setMessages)
  }, [roomId])

  // Auto-scroll
  useEffect(() => {
    if (messages.length === 0) return

    if (isFirstLoadRef.current) {
      // Jump immediately on first load
      messagesEndRef.current?.scrollIntoView()
      isFirstLoadRef.current = false
      return
    }

    // Smooth scroll only for own new messages
    const last = messages[messages.length - 1]
    if (last.senderId === userId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, userId])

  // Presence
  const { startTyping, stopTyping } = usePresence(
    roomId ?? '',
    userId,
    displayName,
    setActiveUsers,
    setTypingUsers
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSendText = useCallback(
    async (text: string) => {
      if (!roomId) return
      await sendTextMessage(roomId, userId, displayName, text)
      stopTyping()
    },
    [roomId, userId, displayName, stopTyping]
  )

  const handleSendImage = useCallback(
    async (file: File) => {
      if (!roomId) return
      await sendImageMessage(roomId, userId, displayName, file)
    },
    [roomId, userId, displayName]
  )

  const handleSendFile = useCallback(
    async (file: File) => {
      if (!roomId) return
      await sendFileMessage(roomId, userId, displayName, file)
    },
    [roomId, userId, displayName]
  )

  const handleSendAudio = useCallback(
    async (blob: Blob, durationSeconds: number) => {
      if (!roomId) return
      await sendAudioMessage(roomId, userId, displayName, blob, durationSeconds)
    },
    [roomId, userId, displayName]
  )

  const handleLeave = useCallback(async () => {
    if (roomId) await leaveRoom(roomId, userId)
    navigate('/')
    toast('You left the room.')
  }, [roomId, userId, navigate])

  const handleCloseRoom = useCallback(async () => {
    if (!roomId) return
    await closeRoom(roomId)
    toast.success('Room closed.')
    navigate('/')
  }, [roomId, navigate])

  const handleChangePassword = useCallback(
    async (newPassword: string) => {
      if (!roomId) return
      await updateRoomPassword(roomId, newPassword)
      toast.success('Password updated!')
    },
    [roomId]
  )

  const handleRemoveUser = useCallback(
    async (targetUserId: string) => {
      if (!roomId) return
      await leaveRoom(roomId, targetUserId)
      toast.success('User removed.')
    },
    [roomId]
  )

  // ── Guards ────────────────────────────────────────────────────────────────

  if (!session) return null
  if (loading) return <PageLoader />

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <MessageSquare size={48} className="text-surface-700" />
        <p className="text-surface-500">Room not found or has expired.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Go Home
        </button>
      </div>
    )
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Show avatar when the sender changes from the previous message */
  const showAvatar = (index: number) =>
    index === 0 || messages[index - 1].senderId !== messages[index].senderId

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden">
      <RoomHeader
        room={room}
        onlineCount={activeUsers.length}
        currentUserId={userId}
        onLeave={handleLeave}
        onClose={handleCloseRoom}
        onChangePassword={handleChangePassword}
        onToggleUserList={() => setShowUserList(v => !v)}
      />

      <div className="flex-1 flex min-h-0">
        {/* ── Messages pane ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Scrollable messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-24 select-none">
                <MessageSquare size={38} className="text-surface-800" />
                <p className="text-surface-600 text-sm">No messages yet. Say hello! 👋</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isSelf={msg.senderId === userId}
                  showAvatar={showAvatar(i)}
                />
              ))
            )}

            <TypingIndicator typingUsers={typingUsers} />
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <MessageInput
            onSendText={handleSendText}
            onSendImage={handleSendImage}
            onSendFile={handleSendFile}
            onSendAudio={handleSendAudio}
            onTyping={startTyping}
            disabled={!room.isActive}
          />
        </div>

        {/* ── User list sidebar ── */}
        {showUserList && (
          <>
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 z-20 bg-black/50 lg:hidden"
              onClick={() => setShowUserList(false)}
            />
            {/* Sidebar panel */}
            <aside className="fixed right-0 top-0 bottom-0 z-30 w-64 bg-surface-900 border-l border-surface-800 lg:relative lg:z-auto animate-slide-in-right">
              <UserList
                users={activeUsers}
                currentUserId={userId}
                ownerId={room.ownerId}
                isOwner={room.ownerId === userId}
                onRemoveUser={handleRemoveUser}
                onClose={() => setShowUserList(false)}
              />
            </aside>
          </>
        )}
      </div>
    </div>
  )
}
