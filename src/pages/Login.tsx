import { useState } from 'react';
import { Lock, LogIn, ShieldCheck, AlertCircle, Loader2, Mail, FlaskConical } from 'lucide-react';
import { supabase, OWNER_EMAIL, DEMO_EMAIL, DEMO_PASSWORD } from '../lib/supabase';

type Mode = 'login' | 'setup';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState(OWNER_EMAIL);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(withEmail: string, withPassword: string) {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: withEmail.trim(), password: withPassword });
    setBusy(false);
    if (error) {
      if (/invalid login credentials/i.test(error.message)) {
        setError('Wrong email or password. First time as owner? Tap “Set your password”.');
        return;
      }
      setError(error.message);
    }
  }

  async function useDemo() {
    setError(null);
    setMode('login');
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    await signIn(DEMO_EMAIL, DEMO_PASSWORD);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError('Authentication is not configured.');
      return;
    }

    if (mode === 'setup') {
      if (email.trim().toLowerCase() !== OWNER_EMAIL) {
        setError('Only the owner account can set a password here.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirm) {
        setError('Passwords do not match.');
        return;
      }
      setBusy(true);
      const { error } = await supabase.auth.signUp({ email: OWNER_EMAIL, password });
      setBusy(false);
      if (error) {
        if (/already registered|already exists/i.test(error.message)) {
          setError('This account already has a password. Please log in instead.');
          setMode('login');
          return;
        }
        setError(error.message);
        return;
      }
      // Autoconfirm is on → a session is created and the app unlocks.
      return;
    }

    // login
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    await signIn(email, password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-white shadow-card">₱</div>
          <h1 className="mt-3 text-xl font-bold text-slate-800">Mam-She Financing</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>

        <div className="card p-6">
          <h2 className="font-bold text-slate-800">
            {mode === 'login' ? 'Log in' : 'Set your password'}
          </h2>
          <p className="mb-4 mt-0.5 text-sm text-slate-500">
            {mode === 'login'
              ? 'Sign in to access the dashboard.'
              : 'First time as owner? Create the password for the owner account.'}
          </p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input !pl-9"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">{mode === 'login' ? 'Password' : 'New password'}</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="input !pl-9"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {mode === 'setup' && (
              <div>
                <label className="label">Confirm password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input !pl-9"
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {mode === 'login' ? 'Log in' : 'Set password & sign in'}
            </button>
          </form>

          {mode === 'login' && (
            <>
              <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
                <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
              </div>
              <button type="button" onClick={useDemo} disabled={busy} className="btn-secondary w-full">
                <FlaskConical className="h-4 w-4" /> Use demo account
              </button>
              <p className="mt-1.5 text-center text-xs text-slate-400">Explore &amp; revise with sample data before the official launch.</p>
            </>
          )}

          <div className="mt-4 text-center text-sm">
            {mode === 'login' ? (
              <button className="font-semibold text-brand-600 hover:text-brand-700" onClick={() => { setMode('setup'); setEmail(OWNER_EMAIL); setError(null); }}>
                First time? Set the owner password
              </button>
            ) : (
              <button className="font-semibold text-brand-600 hover:text-brand-700" onClick={() => { setMode('login'); setError(null); }}>
                Already have a password? Log in
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" /> Owner: {OWNER_EMAIL}
        </div>
      </div>
    </div>
  );
}
