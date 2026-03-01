import { useGameStore } from '../store/gameStore'
import { useTimer } from '../hooks/useTimer'
import SetupForm from '../components/SetupForm'
import HiddenCard from '../components/HiddenCard'
import CardView from '../components/CardView'
import Controls from '../components/Controls'
import ScoreBoard from '../components/ScoreBoard'
import Timer from '../components/Timer'

export default function Game() {
  const phase = useGameStore(s => s.phase)
  const currentCardId = useGameStore(s => s.currentCardId)
  const cardsById = useGameStore(s => s.cardsById)

  useTimer()

  const card = currentCardId ? cardsById[currentCardId] : undefined

  return (
    <div className="mx-auto max-w-md p-4 flex flex-col gap-4 min-h-screen">
      {phase === 'SETUP' ? (
        <div className="mt-10">
          <SetupForm />
        </div>
      ) : (
        <>
          <ScoreBoard />
          <Timer />
          {phase === 'WAITING' && <HiddenCard />}
          {phase !== 'WAITING' && card && <CardView card={card} />}
          <Controls />
          <p className="text-center text-xs text-slate-300 mt-auto">
            Tip: Hand the phone to the actor while others look away.
          </p>
        </>
      )}
    </div>
  )
}
