import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './features/auth/AuthContext.tsx';
import { TooltipProvider } from './components/ui/tooltip.tsx';
import { initTheme } from './lib/theme';

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <AuthProvider>
        <App />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </TooltipProvider>
  </StrictMode>,
);
