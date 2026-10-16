import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@/features/auth/LoginForm';
import { useAuth } from '@/features/auth/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  if (!loading && user) {
    navigate('/', { replace: true });
  }

  return (
    <div className="grid gap-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Sistema Leitner</h1>
        <p className="mt-1 text-sm text-slate-500">Repetición espaciada en 5 cajas (1 · 3 · 7 · 15 · 30 días)</p>
      </div>
      <LoginForm onSuccess={() => navigate('/', { replace: true })} />
    </div>
  );
}
