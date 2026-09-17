import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { hydrateClientStorage } from './shared/lib/indexedDb';
import { initTheme } from './shared/lib/theme';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element with id "root" was not found.');
}

const root = ReactDOM.createRoot(rootElement);

function renderBootSplash() {
  root.render(
    <React.StrictMode>
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-wheat/30 border-t-wheat" />
          <p className="text-sm text-muted">جاري التحميل...</p>
        </div>
      </div>
    </React.StrictMode>
  );
}

function renderApp() {
  initTheme();
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

renderBootSplash();

// Never hang forever on IndexedDB hydrate (common on mobile after long idle).
void Promise.race([
  hydrateClientStorage(),
  new Promise((resolve) => {
    window.setTimeout(resolve, 4000);
  }),
]).finally(() => {
  renderApp();
});
