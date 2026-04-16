import { createContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@/types'
import { api } from '@/lib/api'
import { Role } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  hasRole: (...roles: Role[]) => boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'mmt-crm-auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try { return JSON.parse(stored) } catch { return null }
    }
    return null
  })

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post<User>('/auth/login', { email, password })
      const fetchedUser = response.data
      setUser(fetchedUser)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedUser))
      return true
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const hasRole = useCallback((...roles: Role[]) => {
    if (!user) return false
    return roles.includes(user.role)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}
