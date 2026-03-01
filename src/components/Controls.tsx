import { useGameStore } from '../store/gameStore'

export default function Controls() {
  const phase = useGameStore(s => s.phase)
  const score = useGameStore(s => s.scoreCurrentTeam)
  const nextTurn = useGameStore(s => s.nextTurn)

  if (phase === 'REVEALED') {
    return (
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => score(1)}
          className="rounded bg-emerald-500 text-white py-3 font-semibold"
        >
          ✅ Guessed (+1)
        </button>
        <button
          onClick={() => score(0)}
          className="rounded bg-red-500 text-white py-3 font-semibold"
        >
          ❌ Not Guessed
        </button>
      </div>
    )
  }

  if (phase === 'TIMES_UP') {
    return (
      <div className="grid grid-cols-1">
        <button
          onClick={() => score(0)}
          className="rounded bg-slate-700 text-white py-3 font-semibold"
        >
          Time’s Up → 0 Point
        </button>
      </div>
    )
  }

  if (phase === 'SCORED') {
    return (
      <button
        onClick={nextTurn}
        className="w-full rounded bg-indigo-600 text-white py-3 font-semibold"
      >
        Next Turn
      </button>
    )
  }

  return null
}