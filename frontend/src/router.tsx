import { createBrowserRouter } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { LoginPage } from '@/pages/Login';
import { DashboardPage, dashboardLoader } from '@/pages/Dashboard';
import { StudySessionPage, studyLoader } from '@/pages/StudySession';
import { RouteError } from '@/pages/RouteError';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { path: '/login', element: <LoginPage /> },
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
