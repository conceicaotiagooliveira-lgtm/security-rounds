import { create } from 'zustand';

interface InstallStore {
  deferredPrompt: any | null;
  setDeferredPrompt: (prompt: any | null) => void;
}

export const useInstallStore = create<InstallStore>((set) => ({
  deferredPrompt: null,
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
}));
