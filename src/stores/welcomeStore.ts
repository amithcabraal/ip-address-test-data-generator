import create from 'zustand';
import { persist } from 'zustand/middleware';

interface WelcomeStore {
  showWelcome: boolean;
  dismissWelcome: () => void;
}

export const useWelcomeStore = create<WelcomeStore>()(
  persist(
    (set) => ({
      showWelcome: true,
      dismissWelcome: () => set({ showWelcome: false }),
    }),
    {
      name: 'welcome-storage',
    }
  )
);