import { createContext, useContext, useState, ReactNode } from 'react'
import { UserSession } from '../types'
import { generateUserId } from '../utils/helpers'

interface UserContextType {
  session: UserSession | null
  setSession: (session: UserSession) => void
  clearSession: () => void
}

const UserContext = createContext<UserContextType | null>(null)

const SESSION_KEY = 'temptalk_session'

export function UserProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      return stored ? (JSON.parse(stored) as UserSession) : null
    } catch {
      return null
    }
  })

  const setSession = (newSession: UserSession) => {
    const enriched: UserSession = {
      ...newSession,
      userId: newSession.userId || generateUserId(),
    }
    setSessionState(enriched)
    localStorage.setItem(SESSION_KEY, JSON.stringify(enriched))
  }

  const clearSession = () => {
    setSessionState(null)
    localStorage.removeItem(SESSION_KEY)
  }

  return (
    <UserContext.Provider value={{ session, setSession, clearSession }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
