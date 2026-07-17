import { create } from 'zustand';

export type AppTheme = 'light' | 'dark' | 'midnight' | 'ocean' | 'purple';

interface ThemeState {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const applyThemeClass = (theme: AppTheme) => {
  const root = document.documentElement;
  root.classList.remove('theme-light', 'theme-dark', 'theme-midnight', 'theme-ocean', 'theme-purple', 'dark');
  
  root.classList.add(`theme-${theme}`);
  if (theme !== 'light') {
    root.classList.add('dark');
  }
};

export const useThemeStore = create<ThemeState>((set) => {
  const initialTheme = (localStorage.getItem('leadgrowth-theme') as AppTheme) || 'light';
  applyThemeClass(initialTheme);

  return {
    theme: initialTheme,
    setTheme: (theme) => {
      localStorage.setItem('leadgrowth-theme', theme);
      applyThemeClass(theme);
      set({ theme });
    }
  };
});
