import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '@/features/auth/LoginForm';
import { useAuth } from '@/features/auth/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  // Redirigir solo como efecto (una vez), nunca durante el render:
  // navegar en el render aborta la navegación en curso y re-dispara
  // los loaders, ametrallando /decks y /due en bucle.
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [loading, user, from, navigate]);

  if (loading) {
    return <p className="py-10 text-center text-sm text-slate-500">Cargando sesión…</p>;
  }

  return (
    <div className="grid gap-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">Sistema Leitner</h1>
        <p className="mt-1 text-sm text-slate-500">Repetición espaciada en 5 cajas (1 · 3 · 7 · 15 · 30 días)</p>
      </div>
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
    </div>
  );
}
