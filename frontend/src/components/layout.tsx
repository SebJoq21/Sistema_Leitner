import { Link, Outlet, useLocation, useNavigate, useNavigation } from 'react-router-dom';
import { Button } from './ui/button';
import { Skeleton, SkeletonLine } from './ui/skeleton';
import { useAuth } from '@/features/auth/AuthContext';

function DashboardSkeleton() {
  return (
    <div className="grid gap-6" aria-label="Cargando mazos">
      <div className="flex items-center justify-between gap-3">
        <div className="grid w-48 gap-2">
          <SkeletonLine className="h-6 w-32" />
          <SkeletonLine className="w-40" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 !rounded-xl" />
          <Skeleton className="h-10 w-28 !rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
            <SkeletonLine className="h-5 w-2/3" />
            <SkeletonLine className="w-full" />
            <SkeletonLine className="w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StudySkeleton() {
  return (
    <div className="grid gap-6 py-4" aria-label="Cargando sesión de estudio">
      <SkeletonLine className="mx-auto h-6 w-48" />
      <Skeleton className="mx-auto min-h-64 w-full max-w-xl" />
      <div className="mx-auto flex w-full max-w-xl gap-3">
        <Skeleton className="h-12 flex-1 !rounded-xl" />
        <Skeleton className="h-12 flex-1 !rounded-xl" />
      </div>
    </div>
  );
}

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();
  const isLoading = navigation.state !== 'idle';

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
        {isLoading && location.pathname.startsWith('/study') ? (
          <StudySkeleton />
        ) : isLoading ? (
          <DashboardSkeleton />
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
