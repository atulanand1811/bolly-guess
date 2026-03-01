export type Card = {
  id: string
  characterName: string
  movie: string
  image: string
  hints?: string[]
  famousDialogues?: string[]
}

export type Team = { name: string; score: number }
export type Phase = 'SETUP' | 'WAITING' | 'REVEALED' | 'TIMES_UP' | 'SCORED'