import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { LoginPage } from '@/pages/Login';
import { DashboardPage, dashboardLoader } from '@/pages/Dashboard';
import { StudySessionPage, studyLoader } from '@/pages/StudySession';
import { CardsPage, cardsLoader } from '@/pages/Cards';
import { BoxesPage, boxesLoader } from '@/pages/Boxes';
import { RouteError } from '@/pages/RouteError';
import { api } from '@/lib/api';
import { getStoredToken } from '@/lib/supabase';

// Pendientes para el badge del sidebar. Nunca rompe la navegación.
async function rootLoader() {
  const token = getStoredToken();
  if (!token) return { dueTotal: 0 };
  try {
    return { dueTotal: (await api.dueCards(token)).length };
  } catch {
    return { dueTotal: 0 };
  }
}

// /login va fuera del Layout: sin sidebar ni top-bar, solo el formulario centrado.
export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteError />,
  },
  {
    element: <Layout />,
    loader: rootLoader,
    errorElement: <RouteError />,
    children: [
      {
        path: '/',
        element: (
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        ),
        loader: dashboardLoader,
        errorElement: <RouteError />,
      },
      {
        path: '/cards',
        element: (
          <RequireAuth>
            <CardsPage />
          </RequireAuth>
        ),
        loader: cardsLoader,
        errorElement: <RouteError />,
      },
      {
        path: '/boxes',
        element: (
          <RequireAuth>
            <BoxesPage />
          </RequireAuth>
        ),
        loader: boxesLoader,
        errorElement: <RouteError />,
      },
      {
        path: '/study',
        element: (
          <RequireAuth>
            <StudySessionPage />
          </RequireAuth>
        ),
        loader: studyLoader,
        errorElement: <RouteError />,
      },
    ],
  },
]);
