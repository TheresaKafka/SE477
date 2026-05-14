import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          document.documentElement.classList.remove(state.theme);
          document.documentElement.classList.add(newTheme);
          return { theme: newTheme };
        }),
      setTheme: (theme) =>
        set((state) => {
          document.documentElement.classList.remove(state.theme);
          document.documentElement.classList.add(theme);
          return { theme };
        }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.add(state.theme);
        }
      },
    }
  )
);
