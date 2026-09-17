import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';
import { useServerKeepAlive } from '@/shared/hooks/useServerKeepAlive';
import { useIdleSessionLogout } from '@/features/auth/hooks/useIdleSessionLogout';
import { AppRoutes } from './routes';

function AppSessionGuards() {
  useServerKeepAlive(true);
  useIdleSessionLogout(true);
  return <AppRoutes />;
}

function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <BrowserRouter>
          <AppSessionGuards />
        </BrowserRouter>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;
