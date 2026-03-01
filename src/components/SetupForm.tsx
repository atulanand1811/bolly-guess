import React, { useMemo, useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { loadCards } from '../data/loadCards'

export default function SetupForm() {
  const setup = useGameStore(s => s.setup)

  // form fields
  const [teamA, setTeamA] = useState('Team A')
  const [teamB, setTeamB] = useState('Team B')
  const [duration, setDuration] = useState<number>(60) // optional: 60s default

  // ui state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return (teamA.trim().length > 0) && (teamB.trim().length > 0) && !loading
  }, [teamA, teamB, loading])

  const onStart = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError(null)

    try {
      // Load card dataset
      const cards = await loadCards()
      if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error('No cards found in cards.json')
      }

      // Initialize the game store
      setup(teamA.trim(), teamB.trim(), cards)

      // If you want the duration to be dynamic, you can also:
      // - add an action in the store to set timer duration, or
      // - store it locally in a context. For now, the store uses 60s by default.
      // To wire this fully: extend the store to keep a configurable `roundSeconds`.
      if (duration !== 60) {
        console.warn('Timer duration selector visible but not yet wired to store. Extend the store to use this value.')
      }
    } catch (err: unknown) {
      const message =
        (err as Error)?.message ||
        'Failed to load cards. Make sure public/cards.json exists and is valid JSON.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onStart} className="rounded-2xl bg-white shadow p-5 sm:p-6 grid gap-4">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">BollyGuess</h1>
        <p className="text-sm text-gray-500 mt-1">Local party mode · Single device</p>
      </div>

      {/* Team A */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Team A name</span>
        <input
          value={teamA}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamA(e.target.value)}
          placeholder="e.g. DDLJ Devils"
          className="rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={40}
          inputMode="text"
          aria-label="Team A name"
          required
        />
      </label>

      {/* Team B */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Team B name</span>
        <input
          value={teamB}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTeamB(e.target.value)}
          placeholder="e.g. Sholay Sharks"
          className="rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={40}
          inputMode="text"
          aria-label="Team B name"
          required
        />
      </label>

      {/* OPTIONAL: Round duration selector (UI only until store is extended) */}
      <label className="grid gap-1">
        <span className="text-sm text-gray-700">Round timer</span>
        <select
          value={duration}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDuration(Number(e.target.value))}
          className="rounded-lg border border-gray-300 p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          aria-label="Round timer"
        >
          <option value={30}>30 seconds</option>
          <option value={60}>60 seconds (default)</option>
          <option value={90}>90 seconds</option>
        </select>
        <span className="text-[11px] text-gray-500">
          (Note: timer uses 60s by default—extend store to wire this value.)
        </span>
      </label>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-md p-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`rounded-lg py-3 font-semibold transition ${
          canSubmit
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
        }`}
        aria-busy={loading}
      >
        {loading ? 'Starting…' : 'Start Game'}
      </button>

      <div className="text-[11px] text-center text-gray-500">
        Make sure <code className="px-1 rounded bg-gray-100">public/cards.json</code> exists with your deck.
      </div>
    </form>
  )
}