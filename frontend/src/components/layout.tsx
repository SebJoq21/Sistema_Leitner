import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '@/features/auth/AuthContext';

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="text-base font-extrabold tracking-tight text-indigo-600">
            Leitner
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm">
                Mazos
              </Button>
            </Link>
            <Link to="/study">
              <Button variant="ghost" size="sm">
                Estudiar
              </Button>
            </Link>
            {user ? (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Salir
              </Button>
            ) : (
              <Link to="/login">
                <Button size="sm">Entrar</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
