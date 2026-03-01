import { useGameStore } from '../store/gameStore'
export default function ScoreBoard() {
  const teams = useGameStore(s => s.teams)
  const currentTeamIndex = useGameStore(s => s.currentTeamIndex)
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-100 p-3">
      {teams.map((t, i) => (
        <div key={i} className={`flex-1 text-center ${i===currentTeamIndex ? 'font-bold' : ''}`}>
          {t.name}: {t.score}
        </div>
      ))}
    </div>
  )
}
