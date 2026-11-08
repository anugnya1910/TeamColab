import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center dark:bg-zinc-950">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-zinc-500">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/dashboard" className="btn-primary mt-6"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
    </div>
  );
}
