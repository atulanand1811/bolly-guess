import { useGameStore } from '../store/gameStore'

export default function HiddenCard() {
  const reveal = useGameStore(s => s.reveal)
  const teamIdx = useGameStore(s => s.currentTeamIndex)
  const team = useGameStore(s => s.teams[teamIdx])

  return (
    <div className="rounded-xl bg-slate-800 text-white p-6 text-center">
      <p className="mb-3">It’s <b>{team.name}</b>’s turn</p>
      <button
        onClick={reveal}
        className="w-full rounded-lg bg-emerald-500 py-3 text-lg font-semibold"
      >
        Reveal Card & Start Timer
      </button>
      <p className="mt-2 text-sm text-slate-300">Only the actor should look at the screen.</p>
    </div>
  )
}