import React, { useEffect, useMemo, useRef, useState } from 'react'

/** If you already defined this in src/types.ts, you can import it instead. */
type Card = {
  id: string
  characterName: string
  movie: string
  image: string
  hints?: string[]
}

/** 🔐 Hardcoded credentials (client-side; OK for local/admin usage) */
const ADMIN_USER = 'admin'
const ADMIN_PASS = 'letmein' // ← change this before committing

const DRAFT_KEY = 'cards_admin_draft_v1'

function normalizeArray(json: unknown): Card[] {
  if (!Array.isArray(json)) return []
  return json
    .map((row: any) => ({
      id: String(row?.id ?? '').trim(),
      characterName: String(row?.characterName ?? '').trim(),
      movie: String(row?.movie ?? '').trim(),
      image: String(row?.image ?? '').trim(),
      hints: Array.isArray(row?.hints)
        ? row.hints.map((h: any) => String(h).trim()).filter(Boolean)
        : undefined
    }))
    .filter((r) => r.id && r.characterName && r.movie && r.image)
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminCards() {
  /** -------- Auth -------- */
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  const login = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setAuthed(true)
      setAuthError(null)
      setUsername('')
      setPassword('')
    } else {
      setAuthError('Invalid username or password')
    }
  }

  /** -------- Data -------- */
  const [cards, setCards] = useState<Card[]>([])
  const [loadedFrom, setLoadedFrom] = useState<'server' | 'draft' | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // autosave to localStorage (draft)
  useEffect(() => {
    if (!authed) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(cards))
    } catch {}
  }, [cards, authed])

  // load order: 1) draft if exists, else 2) /cards.json
  useEffect(() => {
    if (!authed) return
    const draft = localStorage.getItem(DRAFT_KEY)
    if (draft) {
      try {
        const parsed = normalizeArray(JSON.parse(draft))
        setCards(parsed)
        setLoadedFrom('draft')
        return
      } catch {
        // ignore and fall back to server
      }
    }
    ;(async () => {
      setLoading(true)
      setLoadError(null)
      try {
        // Avoid cache while authoring
        const res = await fetch('/cards.json', { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const normalized = normalizeArray(json)
        setCards(normalized)
        setLoadedFrom('server')
      } catch (err: any) {
        setLoadError(err?.message || 'Failed to load /cards.json')
        setCards([])
      } finally {
        setLoading(false)
      }
    })()
  }, [authed])

  // Reload from server (discard draft)
  async function reloadFromServer() {
    if (!confirm('Discard unsaved draft and reload from /cards.json?')) return
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {}
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch('/cards.json', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const normalized = normalizeArray(json)
      setCards(normalized)
      setLoadedFrom('server')
    } catch (err: any) {
      setLoadError(err?.message || 'Failed to load /cards.json')
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  // Optional: import from local .json file to merge/replace
  const fileRef = useRef<HTMLInputElement | null>(null)
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = normalizeArray(JSON.parse(text))
      if (!data.length) throw new Error('JSON not an array or empty')
      setCards(data)
      setLoadedFrom('draft')
      alert(`Imported ${data.length} cards from file.`)
    } catch (err: any) {
      alert('Failed to import JSON: ' + (err?.message || 'Unknown error'))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Download
  function downloadJSON(pretty = true) {
    const clean = cards.map((c) => {
      const out: any = {
        id: c.id,
        characterName: c.characterName,
        movie: c.movie,
        image: c.image
      }
      if (c.hints?.length) out.hints = c.hints
      return out
    })
    const blob = new Blob([JSON.stringify(clean, null, pretty ? 2 : 0)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cards.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  /** -------- Form (add/edit) -------- */
  const [idxEditing, setIdxEditing] = useState<number | null>(null)
  const [fCharacter, setFCharacter] = useState('')
  const [fMovie, setFMovie] = useState('')
  const [fId, setFId] = useState('')
  const [fImage, setFImage] = useState('')
  const [fHints, setFHints] = useState('') // comma-separated

  const canSubmit = useMemo(() => {
    return fId.trim() && fCharacter.trim() && fMovie.trim() && fImage.trim()
  }, [fId, fCharacter, fMovie, fImage])

  function fillIdFromFields() {
    if (!fCharacter || !fMovie) return
    setFId(`${slugify(fMovie)}-${slugify(fCharacter)}`)
  }

  function resetForm() {
    setIdxEditing(null)
    setFCharacter('')
    setFMovie('')
    setFId('')
    setFImage('')
    setFHints('')
  }

  function onEdit(i: number) {
    const c = cards[i]
    setIdxEditing(i)
    setFCharacter(c.characterName)
    setFMovie(c.movie)
    setFId(c.id)
    setFImage(c.image)
    setFHints((c.hints || []).join(', '))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function onDelete(i: number) {
    if (!confirm('Delete this card?')) return
    setCards((prev) => prev.filter((_, idx) => idx !== i))
    if (idxEditing === i) resetForm()
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return

    const newCard: Card = {
      id: fId.trim(),
      characterName: fCharacter.trim(),
      movie: fMovie.trim(),
      image: fImage.trim()
    }
    const hintsArr = fHints
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (hintsArr.length) newCard.hints = hintsArr

    setCards((prev) => {
      // Prevent duplicate IDs when adding a new one
      if (idxEditing === null && prev.some((c) => c.id === newCard.id)) {
        alert(`A card with id "${newCard.id}" already exists.`)
        return prev
      }
      // Edit vs Add
      if (idxEditing !== null) {
        const copy = [...prev]
        copy[idxEditing] = newCard
        return copy
      }
      return [...prev, newCard]
    })

    resetForm()
  }

  /** -------- Render -------- */
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm rounded-xl bg-white shadow p-6 grid gap-3">
          <h1 className="text-2xl font-bold text-center">Admin Login</h1>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Username</span>
            <input
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              className="rounded border p-2"
              autoComplete="username"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-sm text-gray-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="rounded border p-2"
              autoComplete="current-password"
            />
          </label>
          {authError && <p className="text-sm text-red-600">{authError}</p>}
          <button className="rounded bg-indigo-600 text-white py-2 font-semibold">Sign in</button>
          <p className="text-[11px] text-gray-500">
            Local/dev only. Credentials are hardcoded in client code.
          </p>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-4 grid gap-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Cards Admin</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={onImportFile}
            className="text-sm text-white"
            aria-label="Import JSON file"
          />
          <button
            onClick={() => downloadJSON(true)}
            className="rounded bg-emerald-600 text-white px-3 py-2 text-sm font-semibold"
          >
            Download JSON
          </button>
          <button
            onClick={reloadFromServer}
            className="rounded bg-slate-700 text-white px-3 py-2 text-sm font-semibold"
            title="Discard draft and reload /cards.json"
          >
            Reload from /cards.json
          </button>
        </div>
      </header>

      {loading && <p className="text-slate-200 text-sm">Loading cards…</p>}
      {loadError && <p className="text-red-400 text-sm">Error: {loadError}</p>}
      {loadedFrom && !loading && (
        <p className="text-slate-300 text-xs">
          Loaded from <b>{loadedFrom === 'draft' ? 'local draft (autosave)' : '/cards.json'}</b>.
          Your edits are saved locally until you download and replace <code>public/cards.json</code>.
        </p>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="rounded-xl bg-white shadow p-4 grid gap-3">
        <div className="grid gap-1">
          <label className="text-sm text-gray-700">Character Name</label>
          <input
            value={fCharacter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFCharacter(e.target.value)}
            onBlur={fillIdFromFields}
            placeholder="e.g. Raj Malhotra"
            className="rounded border p-2"
            maxLength={80}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-gray-700">Movie</label>
          <input
            value={fMovie}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFMovie(e.target.value)}
            onBlur={fillIdFromFields}
            placeholder="e.g. Dilwale Dulhania Le Jayenge (1995)"
            className="rounded border p-2"
            maxLength={120}
          />
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-gray-700">ID (unique)</label>
          <input
            value={fId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFId(e.target.value)}
            placeholder="auto-fills from Movie + Character (editable)"
            className="rounded border p-2 font-mono"
            maxLength={140}
          />
          <p className="text-[11px] text-gray-500">
            Use lowercase-dashes, e.g. <code>ddlj-raj-malhotra</code>
          </p>
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-gray-700">Image URL</label>
          <input
            value={fImage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFImage(e.target.value)}
            placeholder="https://..."
            className="rounded border p-2"
            inputMode="url"
          />
          <p className="text-[11px] text-gray-500">
            Paste a public image URL. The preview below will show if it loads.
          </p>
        </div>

        <div className="grid gap-1">
          <label className="text-sm text-gray-700">Hints (optional, comma-separated)</label>
          <input
            value={fHints}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFHints(e.target.value)}
            placeholder="e.g. Train scene, Europe trip, Palat"
            className="rounded border p-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className={`rounded px-4 py-2 font-semibold ${
              canSubmit ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {idxEditing !== null ? 'Save Changes' : 'Add Card'}
          </button>
          {idxEditing !== null && (
            <button type="button" onClick={resetForm} className="rounded px-4 py-2 font-semibold bg-slate-200">
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <section className="rounded-xl bg-white shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Cards ({cards.length})</h2>
          <small className="text-gray-500">Edit to modify, or delete to remove</small>
        </div>

        <div className="grid gap-3">
          {cards.length === 0 && <p className="text-sm text-gray-600">No cards yet.</p>}

          {cards.map((c, i) => (
            <div key={c.id || i} className="border rounded-lg p-3 grid gap-2">
              <div className="flex items-start gap-3">
                <img
                  src={c.image}
                  alt={c.characterName}
                  className="w-20 h-20 object-cover rounded-md bg-slate-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,' +
                      encodeURIComponent(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="12" fill="#6b7280">Image not found</text></svg>`
                      )
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{c.characterName}</div>
                  <div className="text-sm text-gray-600">{c.movie}</div>
                  <div className="text-xs text-gray-500 break-words">{c.image}</div>
                  {!!c.hints?.length && (
                    <div className="text-xs text-gray-500">Hints: {c.hints.join(', ')}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded bg-emerald-600 text-white px-3 py-1 text-sm"
                  onClick={() => onEdit(i)}
                >
                  Edit
                </button>
                <button
                  className="rounded bg-red-600 text-white px-3 py-1 text-sm"
                  onClick={() => onDelete(i)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-xs text-slate-300">
        When ready, click <b>Download JSON</b>. Replace <code>public/cards.json</code> locally and redeploy.
      </p>
    </div>
  )
}