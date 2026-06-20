import { useCallback, useRef, useState } from 'react'

interface UseVoiceRecorderReturn {
  /** True while a recording is actively in progress. */
  isRecording: boolean
  /** Elapsed recording time in whole seconds. */
  recordingSeconds: number
  /** Most recent recorder error, if any (e.g. mic permission denied). */
  error: string | null
  /** Request mic access and start recording. */
  startRecording: () => Promise<void>
  /** Stop recording and resolve with the recorded audio Blob (or null if nothing was captured). */
  stopRecording: () => Promise<Blob | null>
  /** Abort the current recording without returning a blob. */
  cancelRecording: () => void
}

/** Pick the best-supported audio mime type for MediaRecorder in this browser. */
function pickMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  return candidates.find(type => MediaRecorder.isTypeSupported?.(type))
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    recorderRef.current = null
    chunksRef.current = []
  }, [])

  const startRecording = useCallback(async () => {
    setError(null)

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Voice recording is not supported in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
streamRef.current = stream

      const mimeType = pickMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

      chunksRef.current = []
      recorder.ondataavailable = event => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
}

      recorderRef.current = recorder
      recorder.start(100)

      setIsRecording(true)
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000)
    } catch {
      setError('Microphone access was denied or is unavailable.')
      cleanup()
    }
  }, [cleanup])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise(resolve => {
      const recorder = recorderRef.current
      if (!recorder) {
        setIsRecording(false)
        resolve(null)
        return
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })

console.log("Recorder mime type:", mimeType)
console.log("Chunks:", chunksRef.current.length)
console.log("Blob size:", blob.size)
console.log("Blob type:", blob.type)
        setIsRecording(false)
        cleanup()
        resolve(blob.size > 0 ? blob : null)
      }

      recorder.stop()
    })
  }, [cleanup])

  const cancelRecording = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null
      recorder.stop()
    }
    setIsRecording(false)
    setRecordingSeconds(0)
    cleanup()
  }, [cleanup])

  return { isRecording, recordingSeconds, error, startRecording, stopRecording, cancelRecording }
}
