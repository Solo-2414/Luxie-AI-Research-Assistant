"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
const TOKEN_KEY = "luxcie_access_token"

export interface AuthUser {
  id: number
  email: string
  full_name: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (accessToken: string) => Promise<void>
  logout: () => void
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const checkSession = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      setToken(null)
      setUser(null)
      setLoading(false)
      return
    }

    setToken(storedToken)
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
      if (!response.ok) {
        logout()
        return
      }
      setUser((await response.json()) as AuthUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [logout])

  const login = useCallback(async (accessToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    setToken(accessToken)
    await checkSession()
  }, [checkSession])

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
