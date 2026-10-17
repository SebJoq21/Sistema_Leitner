import { useEffect, useState } from 'react';
import { Link, Outlet, useLoaderData, useLocation, useNavigate, useNavigation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Skeleton, SkeletonLine } from './ui/skeleton';
import { SidebarBody } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
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

function RowsSkeleton() {
  return (
    <div className="grid gap-3" aria-label="Cargando tarjetas">
      <SkeletonLine className="h-6 w-40" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-20 w-full !rounded-xl" />
      ))}
    </div>
  );
}

function BoxesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Cargando cajas">
      {[0, 1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}

function PendingContent({ pathname }: { pathname: string }) {
  if (pathname.startsWith('/study')) return <StudySkeleton />;
  if (pathname.startsWith('/cards')) return <RowsSkeleton />;
  if (pathname.startsWith('/boxes')) return <BoxesSkeleton />;
  return <DashboardSkeleton />;
}

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();
  const rootData = useLoaderData() as { dueTotal?: number } | undefined;
  const dueCount = rootData?.dueTotal ?? 0;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isLoading = navigation.state !== 'idle';

  async function handleSignOut() {
    await signOut();
    setDrawerOpen(false);
    navigate('/login');
  }

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-primary-muted text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Top bar solo móvil: el sidebar vive en drawer */}
      <header className="sticky top-0 z-40 bg-secondary-navy text-white md:hidden dark:bg-slate-950">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl border border-white/20 p-2 leading-none hover:bg-white/10"
          >
            <Menu className="size-5" />
          </button>
          <Link to="/" className="text-base font-extrabold tracking-tight text-white">
            Leitner
          </Link>
          <div className="ml-auto">
            <ThemeToggle className="py-1.5" />
          </div>
        </div>
      </header>

      {/* Sidebar fijo en desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 bg-secondary-navy md:block dark:bg-slate-950">
        <SidebarBody email={user?.email} dueCount={dueCount} onSignOut={handleSignOut} />
      </aside>

      {/* Drawer móvil */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-secondary-navy shadow-xl dark:bg-slate-950">
            <div className="flex justify-end p-2">
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl p-2 leading-none text-white hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarBody email={user?.email} dueCount={dueCount} onSignOut={handleSignOut} />
          </aside>
        </div>
      )}

      <div className="md:pl-60">
        <main className="mx-auto max-w-5xl px-4 py-8">
          {isLoading ? <PendingContent pathname={location.pathname} /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
