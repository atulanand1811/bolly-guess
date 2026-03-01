import { create } from 'zustand'
import type { Card, Team, Phase } from '../types'

type GameState = {
  phase: Phase
  teams: [Team, Team]
  currentTeamIndex: number
  deck: string[]
  deckIndex: number
  cardsById: Record<string, Card>
  currentCardId?: string
  secondsLeft: number
  timerRunning: boolean
  setup: (teamA: string, teamB: string, cards: Card[]) => void
  reveal: () => void
  tick: () => void
  timeUp: () => void
  scoreCurrentTeam: (points: number) => void
  nextTurn: () => void
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'SETUP',
  teams: [{ name: 'Team A', score: 0 }, { name: 'Team B', score: 0 }],
  currentTeamIndex: 0,
  deck: [],
  deckIndex: 0,
  cardsById: {},
  currentCardId: undefined,
  secondsLeft: 60,
  timerRunning: false,

  setup: (teamA, teamB, cards) => {
    const cardsById = Object.fromEntries(cards.map(c => [c.id, c]))
    const deck = shuffle(cards.map(c => c.id))
    set({
      phase: 'WAITING',
      teams: [{ name: teamA || 'Team A', score: 0 }, { name: teamB || 'Team B', score: 0 }] as [Team, Team],
      currentTeamIndex: 0,
      deck,
      deckIndex: 0,
      cardsById,
      currentCardId: deck[0],
      secondsLeft: 60,
      timerRunning: false
    })
  },

  reveal: () => {
    set({ phase: 'REVEALED', secondsLeft: 60, timerRunning: true })
  },

  tick: () => {
    const { secondsLeft, timerRunning, phase } = get()
    if (!timerRunning || phase !== 'REVEALED') return
    const next = secondsLeft - 1
    if (next <= 0) {
      get().timeUp()
    } else {
      set({ secondsLeft: next })
    }
  },

  timeUp: () => {
    set({ phase: 'TIMES_UP', timerRunning: false, secondsLeft: 0 })
  },

  scoreCurrentTeam: (points) => {
    const { teams, currentTeamIndex } = get()
    const updated: [Team, Team] = JSON.parse(JSON.stringify(teams))
    updated[currentTeamIndex].score += points
    set({ teams: updated, phase: 'SCORED', timerRunning: false })
  },

  nextTurn: () => {
    const { deck, deckIndex } = get()
    let nextIndex = deckIndex + 1
    let nextDeck = deck
    if (nextIndex >= deck.length) {
      nextDeck = shuffle(deck)  // all used → reshuffle
      nextIndex = 0
    }
    const nextCardId = nextDeck[nextIndex]
    set((state) => ({
      deck: nextDeck,
      deckIndex: nextIndex,
      currentCardId: nextCardId,
      currentTeamIndex: state.currentTeamIndex ^ 1, // toggle 0<->1
      phase: 'WAITING',
      secondsLeft: 60,
      timerRunning: false
    }))
  }
}))