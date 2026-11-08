import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';
import { Spinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { errMsg } from '../api/axios';
import { cn, firstName } from '../lib/utils';

const DEMO = { email: 'demo@teamsync.com', password: 'demo123' };

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const validate = () => {
    const e = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const doLogin = async (creds) => {
    setLoading(true);
    try {
      const u = await login(creds.email, creds.password);
      toast.success(`Welcome back, ${firstName(u.name)}!`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(errMsg(err, 'Login failed'));
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (validate()) doLogin(form);
  };

  const useDemo = () => {
    setForm(DEMO);
    setErrors({});
    doLogin(DEMO);
  };

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Welcome back</h2>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Log in to continue to your workspace.</p>

      <button onClick={useDemo} disabled={loading} className="btn-secondary mt-8 w-full py-2.5">
        <Sparkles className="h-4 w-4 text-brand-600" /> Continue with demo account
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" /> or sign in with email <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input type="email" autoComplete="email" className={cn('input pl-9', errors.email && 'input-error')} placeholder="you@example.com" value={form.email} onChange={set('email')} />
          </div>
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input type={show ? 'text' : 'password'} autoComplete="current-password" className={cn('input px-9', errors.password && 'input-error')} placeholder="••••••••" value={form.password} onChange={set('password')} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600" aria-label="Toggle password visibility">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
          {loading ? <Spinner /> : <>Log in <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <div className="mt-6 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3.5 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
        <span className="font-medium text-zinc-700 dark:text-zinc-300">Demo credentials:</span> demo@teamsync.com · demo123
      </div>

      <p className="mt-8 text-center text-sm text-zinc-500">
        New to TeamSync?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">Create an account</Link>
      </p>
    </AuthLayout>
  );
}
