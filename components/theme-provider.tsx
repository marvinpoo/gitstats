"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, forcedTheme, ...props }: ThemeProviderProps) {
  // Always disable system theme detection
  return (
    <NextThemesProvider forcedTheme={forcedTheme} enableSystem={false} defaultTheme="light" {...props}>
      {children}
    </NextThemesProvider>
  )
}

