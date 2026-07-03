import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'

interface OwnerBarProps {
  forgeMode: boolean
  onForgeModeChange: (on: boolean) => void
  saving: boolean
}

/**
 * Owner controls. Signed out: a quiet "Owner" link in the footer area.
 * Signed in: a bar with the Forge Mode toggle. Forge Mode = edit mode.
 */
export default function OwnerBar({ forgeMode, onForgeModeChange, saving }: OwnerBarProps) {
  const [signedIn, setSignedIn] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supabaseConfigured) return // seed mode: no owner auth without a backend
    supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => setSignedIn(!!data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e: string, session: unknown) => {
      setSignedIn(!!session)
      if (!session) onForgeModeChange(false)
    })
    return () => sub.subscription.unsubscribe()
  }, [onForgeModeChange])

  const signIn = async () => {
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setShowLogin(false)
    setPassword('')
  }

  const signOut = async () => {
    onForgeModeChange(false)
    await supabase.auth.signOut()
  }

  if (!signedIn) {
    return (
      <div className="owner-corner">
        {showLogin ? (
          <div className="owner-login">
            <div className="owner-login-title">Owner sign in</div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="username"
              onChange={e => setEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && signIn()}
            />
            {error && <div className="owner-error">{error}</div>}
            <div className="owner-login-actions">
              <button className="owner-btn ghost" onClick={() => setShowLogin(false)}>Cancel</button>
              <button className="owner-btn solid" onClick={signIn} disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </div>
        ) : (
          <button className="owner-link" onClick={() => setShowLogin(true)}>⚒ Owner</button>
        )}
      </div>
    )
  }

  return (
    <div className={`forge-bar ${forgeMode ? 'on' : ''}`}>
      <span className="forge-label">⚒ Forge Mode</span>
      <button
        className={`forge-toggle ${forgeMode ? 'on' : ''}`}
        onClick={() => onForgeModeChange(!forgeMode)}
        aria-pressed={forgeMode}
      >
        <span className="forge-knob" />
      </button>
      <span className="forge-status">
        {saving ? 'Saving…' : forgeMode ? 'Drag windows to arrange. Tap a price or name to edit.' : 'Viewing as customer'}
      </span>
      <button className="owner-btn ghost small" onClick={signOut}>Sign out</button>
    </div>
  )
}
