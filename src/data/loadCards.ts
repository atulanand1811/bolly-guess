import type { Card } from '../types'

export async function loadCards(): Promise<Card[]> {
  const res = await fetch('/cards.json', { cache: 'no-cache' })
  if (!res.ok) throw new Error('Failed to load cards.json')
  return res.json()
}