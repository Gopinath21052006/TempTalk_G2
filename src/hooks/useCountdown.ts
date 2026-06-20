import { useState, useEffect } from 'react'
import { Timestamp } from 'firebase/firestore'
import { formatCountdown } from '../utils/helpers'

interface CountdownResult {
  countdown: string
  isExpired: boolean
}

export function useCountdown(expiresAt: Timestamp | null): CountdownResult {
  const [countdown, setCountdown] = useState('')
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    if (!expiresAt) return

    const tick = () => {
      if (expiresAt.toMillis() < Date.now()) {
        setCountdown('Expired')
        setIsExpired(true)
        return false
      }
      setCountdown(formatCountdown(expiresAt))
      return true
    }

    if (!tick()) return

    const id = setInterval(() => {
      if (!tick()) clearInterval(id)
    }, 1_000)

    return () => clearInterval(id)
  }, [expiresAt])

  return { countdown, isExpired }
}
