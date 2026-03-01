import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'

export function useTimer() {
  const tick = useGameStore(s => s.tick)
  const phase = useGameStore(s => s.phase)
  const timerRunning = useGameStore(s => s.timerRunning)

  const buzzerRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    buzzerRef.current = new Audio('/sounds/buzzer.mp3')
  }, [])

  useEffect(() => {
    if (!timerRunning || phase !== 'REVEALED') return
    const id = setInterval(() => tick(), 1000)
    return () => clearInterval(id)
  }, [timerRunning, phase, tick])

  useEffect(() => {
    if (phase === 'TIMES_UP') {
      buzzerRef.current?.play().catch(() => {/* Some browsers need a prior user gesture */})
    }
  }, [phase])
}