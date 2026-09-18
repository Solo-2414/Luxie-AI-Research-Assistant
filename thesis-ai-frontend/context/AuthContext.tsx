"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface AuthUser {
  id: number
  email: string
  full_name: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", credentials: "include" })
    } catch {
      // Clear local session state even when the API is temporarily unavailable.
    } finally {
      setUser(null)
      setLoading(false)
    }
  }, [])

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
      })
      if (!response.ok) {
        setUser(null)
        return
      }
      setUser((await response.json()) as AuthUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async () => {
    await checkSession()
  }, [checkSession])

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used inside AuthProvider")
  return context
}
