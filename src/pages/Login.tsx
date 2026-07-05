import { useState } from 'react';
import { Lock, LogIn, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, OWNER_EMAIL } from '../lib/supabase';

type Mode = 'login' | 'setup';

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError('Authentication is not configured.');
      return;
    }

    if (mode === 'setup') {
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
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password });
    setBusy(false);
    if (error) {
      if (/invalid login credentials/i.test(error.message)) {
        setError("Wrong password. If this is your first time, tap “Set your password”.");
        return;
      }
      setError(error.message);
      return;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-black text-white shadow-card">₱</div>
          <h1 className="mt-3 text-xl font-bold text-slate-800">Mam-She Financing</h1>
          <p className="text-sm text-slate-500">Owner sign in</p>
        </div>

        <div className="card p-6">
          <div className="mb-5 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-800">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="truncate">{OWNER_EMAIL}</span>
          </div>

          <h2 className="font-bold text-slate-800">
            {mode === 'login' ? 'Enter your password' : 'Set your password'}
          </h2>
          <p className="mb-4 mt-0.5 text-sm text-slate-500">
            {mode === 'login'
              ? 'Sign in to access the dashboard.'
              : 'First time here? Create the password for this account.'}
          </p>

          <form onSubmit={submit} className="space-y-3">
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

          <div className="mt-4 text-center text-sm">
            {mode === 'login' ? (
              <button className="font-semibold text-brand-600 hover:text-brand-700" onClick={() => { setMode('setup'); setError(null); }}>
                First time? Set your password
              </button>
            ) : (
              <button className="font-semibold text-brand-600 hover:text-brand-700" onClick={() => { setMode('login'); setError(null); }}>
                Already have a password? Log in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
