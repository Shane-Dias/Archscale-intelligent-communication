import { createContext, useCallback, useEffect, useMemo, useState } from "react";

export const LIGHT_THEME = "light";
export const DARK_THEME = "dark";
export const THEME_STORAGE_KEY = "archscale-theme";

export const ThemeContext = createContext(null);

/**
 * Reads the persisted theme.
 * The product default is light mode, so anything other than an explicit
 * "dark" preference falls back to light — the OS colour-scheme preference
 * is intentionally ignored.
 */
function readStoredTheme() {
  if (typeof window === "undefined") return LIGHT_THEME;
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === DARK_THEME
      ? DARK_THEME
      : LIGHT_THEME;
  } catch {
    return LIGHT_THEME;
  }
}

/** Applies the theme to <html> so Tailwind's `dark:` variants react. */
function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", theme === DARK_THEME);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* storage unavailable — the theme still works for this session */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === DARK_THEME ? LIGHT_THEME : DARK_THEME));
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, isDark: theme === DARK_THEME }),
    [theme, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
