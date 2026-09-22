import { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

/**
 * Access the current theme and the toggle action.
 * Must be used inside <ThemeProvider>.
 *
 * @returns {{ theme: "light" | "dark", isDark: boolean, toggleTheme: () => void }}
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
