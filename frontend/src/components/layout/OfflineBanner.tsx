/**
 * OfflineBanner.tsx
 * Global banner that shows connection status and pending sync items.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, CheckCircle, CloudOff } from 'lucide-react';
import { useOfflineSync } from '@/services/offlineSync';
import type { SyncStatus } from '@/services/offlineSync';
import { useAuthStore } from '@/store/authStore';

export default function OfflineBanner() {
  const { status, pendingCount, triggerSync } = useOfflineSync();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) return null;

  // Don't show anything if online and nothing pending
  if (status === 'online' && pendingCount === 0) return null;

  const config: Record<SyncStatus, { bg: string; icon: React.ReactNode; text: string; textColor: string }> = {
    offline: {
      bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
      icon: <WifiOff className="w-4 h-4" />,
      text: `Sem conexão — ${pendingCount} ${pendingCount === 1 ? 'item salvo' : 'itens salvos'} localmente`,
      textColor: 'text-white',
    },
    syncing: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      text: `Sincronizando ${pendingCount} ${pendingCount === 1 ? 'item' : 'itens'}...`,
      textColor: 'text-white',
    },
    synced: {
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      icon: <CheckCircle className="w-4 h-4" />,
      text: 'Tudo sincronizado!',
      textColor: 'text-white',
    },
    online: {
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
      icon: <RefreshCw className="w-4 h-4 animate-spin" />,
      text: pendingCount > 0 ? `Internet voltou! Sincronizando ${pendingCount} pendentes...` : '',
      textColor: 'text-white',
    },
  };

  const current = config[status];

  return (
    <AnimatePresence>
      <motion.div
        key={status}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`fixed top-0 left-0 right-0 z-[9999] ${current.bg} shadow-lg`}
      >
        <div className="flex items-center justify-center gap-2.5 px-4 py-2.5">
          <span className={current.textColor}>{current.icon}</span>
          <span className={`text-xs font-bold ${current.textColor} tracking-wide`}>
            {current.text}
          </span>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
