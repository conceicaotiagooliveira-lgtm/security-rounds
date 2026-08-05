import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Check if running on localhost
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

// Register PWA Service Worker in production OR in development if not on localhost
// (This enables PWA install prompt when hosting via npm run dev on sgp.florestal.com)
if (import.meta.env.PROD || !isLocalhost) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        onNeedRefresh() {
          // Never auto-reload — the guard may be mid-patrol
          console.log('[SW] New version available. Will apply on next manual reload.');
        },
        onOfflineReady() {
          console.log('[SW] App ready to work offline');
        },
      });
    })
    .catch((err) => {
      console.error('[SW] Failed to load virtual:pwa-register', err);
    });
} else {
  // Unregister any stale service workers in dev mode on localhost to avoid caching issues during development
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
        console.log('[Dev] Unregistered stale service worker on localhost');
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
