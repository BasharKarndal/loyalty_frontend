import { BrowserRouter } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';
import { useServerKeepAlive } from '@/shared/hooks/useServerKeepAlive';
import { AppRoutes } from './routes';

function App() {
  useServerKeepAlive(true);

  return (
    <ThemeProvider>
      <QueryProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;
