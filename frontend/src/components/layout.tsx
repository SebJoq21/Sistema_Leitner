import { useEffect, useState } from 'react';
import { Link, Outlet, useLoaderData, useLocation, useNavigate, useNavigation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { Skeleton, SkeletonLine } from './ui/skeleton';
import { SidebarBody } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { useAuth } from '@/features/auth/AuthContext';
import { getStoredCollapsed, setStoredCollapsed } from '@/lib/sidebar';
import type { StatsSummary } from '@/lib/api';

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
          <div key={i} className="grid gap-3 rounded-2xl border border-border-soft bg-surface p-6">
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
  const rootData = useLoaderData() as { dueTotal?: number; stats?: StatsSummary | null } | undefined;
  const dueCount = rootData?.dueTotal ?? 0;
  const rachaDias = rootData?.stats?.rachaDias ?? 0;
  const repasadosHoy = rootData?.stats?.repasadosHoy ?? 0;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(getStoredCollapsed);
  const isLoading = navigation.state !== 'idle';

  function handleToggleCollapse() {
    setCollapsed((prev) => {
      setStoredCollapsed(!prev);
      return !prev;
    });
  }

  async function handleSignOut() {
    await signOut();
    setDrawerOpen(false);
    navigate('/login');
  }

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDrawerOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-primary-muted text-ink">
      {/* Top bar solo móvil: el sidebar vive en drawer */}
      <header className="sticky top-0 z-40 bg-sb-bg text-sb-text-strong md:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <button
            type="button"
            aria-label="Abrir menú"
            title="Abrir menú"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl border border-sb-accent/25 p-2 leading-none hover:bg-sb-accent/10"
          >
            <Menu className="size-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 text-base font-extrabold tracking-tight text-sb-text-strong">
            <BrandMark className="size-8" />
            Leitner
          </Link>
        </div>
      </header>

      {/* Sidebar fijo en desktop */}
      <aside
        className={`sidebar scrollbar-none fixed inset-y-0 left-0 z-30 hidden overflow-y-auto transition-[width] duration-200 motion-reduce:transition-none md:block ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        <SidebarBody
          collapsed={collapsed}
          onToggleCollapse={handleToggleCollapse}
          dueCount={dueCount}
          repasadosHoy={repasadosHoy}
          rachaDias={rachaDias}
        />
      </aside>

      {/* Drawer móvil */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-tinta/60" onClick={() => setDrawerOpen(false)} />
          <aside className="sidebar scrollbar-none absolute inset-y-0 left-0 w-64 overflow-y-auto shadow-xl">
            <div className="flex justify-end p-2">
              <button
                type="button"
                aria-label="Cerrar menú"
                title="Cerrar menú"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl p-2 leading-none text-sb-text-strong hover:bg-sb-accent/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarBody
              dueCount={dueCount}
              repasadosHoy={repasadosHoy}
              rachaDias={rachaDias}
              onNavigate={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}

      <div
        className={`transition-[padding] duration-200 motion-reduce:transition-none ${
          collapsed ? 'md:pl-16' : 'md:pl-60'
        }`}
      >
        {/* Topbar de contenido: tema + usuario */}
        <header className="sticky top-14 z-20 flex h-14 items-center justify-end gap-2 border-b border-border-soft bg-surface/88 px-6 backdrop-blur md:top-0">
          <ThemeToggle />
          <UserMenu email={user?.email} onSignOut={handleSignOut} />
        </header>

        <main className="mx-auto max-w-5xl px-4 py-8">
          {isLoading ? <PendingContent pathname={location.pathname} /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}
