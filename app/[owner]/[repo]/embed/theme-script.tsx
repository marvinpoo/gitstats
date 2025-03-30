"use client"

import { useEffect } from "react"

export default function ThemeScript({ theme }: { theme: string }) {
  useEffect(() => {
    // Apply theme immediately
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      document.documentElement.style.colorScheme = "dark"
    } else {
      document.documentElement.classList.remove("dark")
      document.documentElement.style.colorScheme = "light"
    }
  }, [theme])

  return null
}

