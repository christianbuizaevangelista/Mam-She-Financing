import { useState } from 'react';
import { Mail, RotateCcw, ShieldCheck, Clock, Send, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { useData } from '../store/DataContext';
import { useAccount, setAccount } from '../store/account';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PageHeader, Badge } from '../components/ui';

export default function Settings() {
  const data = useData();
  const account = useAccount();

  // Profile (name + phone)
  const [name, setName] = useState(account.name);
  const [phone, setPhone] = useState(account.phone);
  const [profileSaved, setProfileSaved] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const dirty = name.trim() !== account.name || phone.trim() !== account.phone;
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail);

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAccount({ name: name.trim(), phone: phone.trim() });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function sendVerification(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!validEmail) {
      setMsg({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (newEmail.toLowerCase() === account.email.toLowerCase()) {
      setMsg({ type: 'error', text: 'That is already your account email.' });
      return;
    }
    if (!isSupabaseConfigured || !supabase) {
      setMsg({ type: 'error', text: 'Email service is not configured (Supabase required).' });
      return;
    }
    setBusy(true);
    // Changes the account's login email — Supabase sends a confirmation link
    // to the new address, and the change applies once it's confirmed.
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setBusy(false);
    if (error) {
      setMsg({ type: 'error', text: error.message });
      return;
    }
    // Store as the new (pending) account email until the recipient confirms.
    setAccount({ email: newEmail, emailVerified: false });
    setNewEmail('');
    setMsg({
      type: 'success',
      text: `Verification email sent to ${newEmail}. Open your inbox and click the confirmation link to verify the address.`,
    });
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account settings" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Profile */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-brand-600" />
              <h3 className="font-bold text-slate-800">Profile</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">Your name shows in the top-right of the app.</p>
            <form onSubmit={saveProfile} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label">Cellphone number</label>
                <input className="input" placeholder="0917 xxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button type="submit" className="btn-primary" disabled={!dirty}>Save changes</button>
                {profileSaved && (
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Email address */}
          <div className="card p-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-brand-600" />
              <h3 className="font-bold text-slate-800">Email Address</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">Change the email address for this account.</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-xs text-slate-400">Current email</p>
                <p className="font-semibold text-slate-800">{account.email}</p>
              </div>
              {account.emailVerified ? (
                <Badge tone="emerald"><ShieldCheck className="h-3 w-3" /> Verified</Badge>
              ) : (
                <Badge tone="amber"><Clock className="h-3 w-3" /> Pending verification</Badge>
              )}
            </div>

            <form onSubmit={sendVerification} className="mt-5">
              <label className="label">New email address</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="input"
                  type="email"
                  placeholder="new.email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
                <button type="submit" className="btn-primary shrink-0" disabled={busy}>
                  <Send className="h-4 w-4" /> {busy ? 'Sending…' : 'Send verification'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                A verification email will be sent to the new address. The change takes effect once it's confirmed.
              </p>
            </form>

            {msg && (
              <div
                className={`mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
                  msg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {msg.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}
          </div>
        </div>

        {/* Demo data */}
        <div>
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-slate-800">Demo Data</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {data.usingSupabase
                ? 'Data is stored in your Supabase database. Reset to wipe all tables and restore the original sample clients, loans, and payments.'
                : 'All data is stored locally in your browser. Reset to restore the original sample clients, loans, and payments.'}
            </p>
            <button
              className="btn-danger mt-4 w-full"
              onClick={() => {
                if (confirm('Reset all data to the demo sample? This cannot be undone.')) data.resetData();
              }}
            >
              <RotateCcw className="h-4 w-4" /> Reset Demo Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
