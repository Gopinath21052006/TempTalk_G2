import { useEffect, useRef, useCallback } from 'react'
import {
  joinRoom,
  leaveRoom,
  updatePresence,
  setTyping,
  clearTyping,
  subscribeToActiveUsers,
  subscribeToTyping,
} from '../services/presenceService'
import { ActiveUser } from '../types'

interface UsePresenceReturn {
  startTyping: () => void
  stopTyping: () => void
}

export function usePresence(
  roomId: string,
  userId: string,
  displayName: string,
  onUsersChange: (users: ActiveUser[]) => void,
  onTypingChange: (names: string[]) => void
): UsePresenceReturn {
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heartbeatRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const isTypingRef    = useRef(false)

  useEffect(() => {
    if (!roomId || !userId) return

    joinRoom(roomId, userId, displayName)

    // Heartbeat every 20s to stay "online"
    heartbeatRef.current = setInterval(() => {
      updatePresence(roomId, userId)
    }, 20_000)

    const unsubUsers  = subscribeToActiveUsers(roomId, onUsersChange)
    const unsubTyping = subscribeToTyping(roomId, userId, onTypingChange)

    const onVisibility = () => {
      if (!document.hidden) updatePresence(roomId, userId)
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      leaveRoom(roomId, userId)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      unsubUsers()
      unsubTyping()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId])

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true
      setTyping(roomId, userId, displayName)
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      clearTyping(roomId, userId)
    }, 3_000)
  }, [roomId, userId, displayName])

  const stopTyping = useCallback(() => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    isTypingRef.current = false
    clearTyping(roomId, userId)
  }, [roomId, userId])

  return { startTyping, stopTyping }
}
