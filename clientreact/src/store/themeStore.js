import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const apply = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light', // 'light' | 'dark'

      init() {
        // On first load, respect OS preference if no saved preference
        const saved = localStorage.getItem('wh-theme');
        if (!saved) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const initial = prefersDark ? 'dark' : 'light';
          set({ theme: initial });
          apply(initial);
        } else {
          apply(get().theme);
        }
      },

      toggle() {
        const next = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: next });
        apply(next);
      },

      setTheme(t) {
        set({ theme: t });
        apply(t);
      },
    }),
    {
      name: 'wh-theme',
      onRehydrateStorage: () => (state) => {
        if (state) apply(state.theme);
      },
    }
  )
);
