'use client';

import { createContext, useContext, useState } from 'react';

export type Theme = 'dark' | 'light' | 'midnight';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', setTheme: () => {} });

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('theme') as Theme | null) ?? 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readTheme);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div data-theme={theme} className={theme === 'light' ? '' : 'dark'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
