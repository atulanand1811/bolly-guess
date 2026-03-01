import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Card } from '../types'

export default function CardView({ card }: { card: Card }) {
  const [showHints, setShowHints] = useState(false)
  const teamIdx = useGameStore(s => s.currentTeamIndex)
  const team = useGameStore(s => s.teams[teamIdx])

  return (
    <div className="rounded-xl bg-white shadow p-4">
      <img src={card.image} alt={card.characterName} className="rounded-md mb-3 w-full object-cover max-h-72" />
      <h2 className="text-xl font-semibold">{card.characterName}</h2>
      <p className="text-gray-600">{card.movie}</p>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowHints(s => !s)}
          className="rounded bg-slate-200 px-3 py-2 text-sm"
        >
          {showHints ? 'Hide hints' : 'Show hints'}
        </button>
        <span className="text-xs text-gray-500">Team: {team.name}</span>
      </div>

      {showHints && card.hints && (
        <ul className="mt-2 list-disc pl-6 text-sm text-gray-700">
          {card.hints.map((h, i) => <li key={i}>{h}</li>)}
        </ul>
      )}
    </div>
  )
}