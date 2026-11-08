import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Field, Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../api/axios';
import { cn, firstName } from '../lib/utils';

function strength(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH = [
  { label: 'Too short', cls: 'bg-red-500' },
  { label: 'Weak', cls: 'bg-red-500' },
  { label: 'Fair', cls: 'bg-amber-500' },
  { label: 'Good', cls: 'bg-emerald-500' },
  { label: 'Strong', cls: 'bg-emerald-600' },
];

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', role: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    else if (form.name.trim().length < 2) e.name = 'Name is too short';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const u = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role.trim() || undefined });
      toast.success(`Welcome to TeamSync, ${firstName(u.name)}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Registration failed'));
      setLoading(false);
    }
  };

  const s = strength(form.password);

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Create your account</h2>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Start organizing your team's work in minutes.</p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Field label="Full name" error={errors.name}>
          <input autoComplete="name" className={cn('input', errors.name && 'input-error')} placeholder="Jane Doe" value={form.name} onChange={set('name')} />
        </Field>
        <Field label="Work email" error={errors.email}>
          <input type="email" autoComplete="email" className={cn('input', errors.email && 'input-error')} placeholder="you@example.com" value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Role (optional)">
          <input className="input" placeholder="e.g. Frontend Developer" value={form.role} onChange={set('role')} />
        </Field>
        <Field label="Password" error={errors.password}>
          <div className="relative">
            <input type={show ? 'text' : 'password'} autoComplete="new-password" className={cn('input pr-9', errors.password && 'input-error')} placeholder="At least 6 characters" value={form.password} onChange={set('password')} />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span key={i} className={cn('h-1 flex-1 rounded-full', i <= s ? STRENGTH[s].cls : 'bg-zinc-200 dark:bg-zinc-800')} />
                ))}
              </div>
              <span className="text-[11px] text-zinc-500">{STRENGTH[s].label}</span>
            </div>
          )}
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <input type={show ? 'text' : 'password'} autoComplete="new-password" className={cn('input', errors.confirm && 'input-error')} placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
        </Field>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? <Spinner /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Log in</Link>
      </p>
    </AuthLayout>
  );
}
