import { useGameStore } from '../store/gameStore'
export default function Timer() {
  const seconds = useGameStore(s => s.secondsLeft)
  return (
    <div className="text-center text-2xl font-bold tabular-nums text-white">
      ⏱ {String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}
    </div>
  )
}