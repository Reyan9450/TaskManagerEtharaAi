import React, { createContext, useContext, useState } from 'react'
import axiosClient from '../api/axiosClient'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Member'
}

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  login(email: string, password: string): Promise<void>
  register(name: string, email: string, password: string): Promise<void>
  logout(): void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [user, setUser] = useState<AuthUser | null>(readStoredUser)

  const login = async (email: string, password: string): Promise<void> => {
    const response = await axiosClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/login',
      { email, password }
    )
    const { token: newToken, user: newUser } = response.data
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<void> => {
    const response = await axiosClient.post<{ token: string; user: AuthUser }>(
      '/api/auth/register',
      { name, email, password }
    )
    const { token: newToken, user: newUser } = response.data
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = (): void => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  const value: AuthContextValue = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: token !== null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
