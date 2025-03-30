"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type TokenContextType = {
  token: string | null
  setToken: (token: string | null) => void
}

const TokenContext = createContext<TokenContextType | undefined>(undefined)

export function TokenProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("github-token")
    if (storedToken) {
      setToken(storedToken)
    }
  }, [])

  // Save token to localStorage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("github-token", token)
    } else {
      localStorage.removeItem("github-token")
    }
  }, [token])

  return <TokenContext.Provider value={{ token, setToken }}>{children}</TokenContext.Provider>
}

export function useToken() {
  const context = useContext(TokenContext)
  if (context === undefined) {
    throw new Error("useToken must be used within a TokenProvider")
  }
  return context
}

