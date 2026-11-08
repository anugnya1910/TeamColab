import { useState } from 'react';
import { Check, KeyRound, LogOut, Mail, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useApi } from '../hooks/useApi';
import api, { TOKEN_KEY, errMsg } from '../api/axios';
import { Avatar, Field, PageHeader, Spinner } from '../components/ui';
import { AVATAR_COLORS, cn, formatFullDate } from '../lib/utils';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const confirm = useConfirm();
  const { data: stats } = useApi(user ? `/users/${user._id}` : null);
  const [form, setForm] = useState({ name: user.name, role: user.role || '', bio: user.bio || '', avatarColor: user.avatarColor });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.name.trim()) er.name = 'Name is required';
    if (form.bio.length > 300) er.bio = 'Bio must be under 300 characters';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { ...form, name: form.name.trim(), role: form.role.trim(), bio: form.bio.trim() });
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const er = {};
    if (!pw.currentPassword) er.currentPassword = 'Enter your current password';
    if (pw.newPassword.length < 6) er.newPassword = 'Must be at least 6 characters';
    if (pw.newPassword !== pw.confirm) er.confirm = 'Passwords do not match';
    setPwErrors(er);
    if (Object.keys(er).length) return;
    setPwSaving(true);
    try {
      const { data } = await api.put('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      localStorage.setItem(TOKEN_KEY, data.token);
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed successfully');
    } catch (err) {
      setPwErrors({ currentPassword: errMsg(err) });
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = async () => {
    if (await confirm({ title: 'Log out of TeamSync?', confirmText: 'Log out' })) logout();
  };

  const preview = { ...user, ...form };

  return (
    <div>
      <PageHeader title="Profile & settings" description="Manage your personal information and preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="card p-6 text-center">
            <Avatar user={preview} size="xl" className="mx-auto" />
            <h2 className="mt-4 text-lg font-semibold">{preview.name || 'Your name'}</h2>
            <p className="text-sm text-zinc-500">{preview.role}</p>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-zinc-400"><Mail className="h-3 w-3" />{user.email}</p>
            {stats && (
              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                <div><p className="text-lg font-semibold">{stats.projects.length}</p><p className="text-[11px] text-zinc-500">Projects</p></div>
                <div><p className="text-lg font-semibold">{stats.stats.open}</p><p className="text-[11px] text-zinc-500">Open tasks</p></div>
                <div><p className="text-lg font-semibold">{stats.stats.done}</p><p className="text-[11px] text-zinc-500">Completed</p></div>
              </div>
            )}
            <p className="mt-5 text-xs text-zinc-400">Member since {formatFullDate(user.createdAt)}</p>
          </div>

          <div className="card p-5">
            <h3 className="section-title mb-3">Preferences</h3>
            <button onClick={toggleTheme} className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
              <span className="flex items-center gap-2">{theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Appearance</span>
              <span className="text-zinc-500">{theme === 'dark' ? 'Dark' : 'Light'}</span>
            </button>
            <button onClick={handleLogout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <form onSubmit={saveProfile} className="card" noValidate>
            <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <h3 className="section-title">Personal information</h3>
              <p className="text-xs text-zinc-500">This is how teammates see you across TeamSync.</p>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Field label="Full name" error={errors.name}>
                <input className={cn('input', errors.name && 'input-error')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Role / title">
                <input className="input" placeholder="e.g. Backend Developer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </Field>
              <Field label="Email" hint="Email cannot be changed" className="sm:col-span-2">
                <input className="input cursor-not-allowed opacity-70" value={user.email} disabled />
              </Field>
              <Field label={`Bio (${form.bio.length}/300)`} error={errors.bio} className="sm:col-span-2">
                <textarea rows={3} className={cn('input resize-none', errors.bio && 'input-error')} placeholder="A short introduction…" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </Field>
              <Field label="Avatar color" className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button type="button" key={c} onClick={() => setForm({ ...form, avatarColor: c })} className={cn('flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-105', form.avatarColor === c && 'ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-900')} style={{ backgroundColor: c }}>
                      {form.avatarColor === c && <Check className="h-4 w-4 text-white" />}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="flex justify-end border-t border-zinc-100 px-6 py-3.5 dark:border-zinc-800">
              <button type="submit" className="btn-primary" disabled={saving}>{saving && <Spinner />} Save changes</button>
            </div>
          </form>

          <form onSubmit={savePassword} className="card" noValidate>
            <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
              <h3 className="section-title flex items-center gap-2"><KeyRound className="h-4 w-4 text-zinc-400" /> Change password</h3>
              <p className="text-xs text-zinc-500">Passwords are hashed with bcrypt before being stored.</p>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              <Field label="Current password" error={pwErrors.currentPassword}>
                <input type="password" className={cn('input', pwErrors.currentPassword && 'input-error')} value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
              </Field>
              <Field label="New password" error={pwErrors.newPassword}>
                <input type="password" className={cn('input', pwErrors.newPassword && 'input-error')} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />
              </Field>
              <Field label="Confirm new password" error={pwErrors.confirm}>
                <input type="password" className={cn('input', pwErrors.confirm && 'input-error')} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end border-t border-zinc-100 px-6 py-3.5 dark:border-zinc-800">
              <button type="submit" className="btn-secondary" disabled={pwSaving}>{pwSaving && <Spinner />} Update password</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
