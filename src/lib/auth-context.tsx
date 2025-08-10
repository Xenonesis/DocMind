'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from './supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  name: string
  email: string
  avatar: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  loginWithProvider: (provider: 'google' | 'github') => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserFromSupabase(session.user)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUserFromSupabase(session.user)
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const setUserFromSupabase = (supabaseUser: SupabaseUser) => {
    const userData: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
      avatar: supabaseUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.email}`
    }
    setUser(userData)
  }

  const login = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    router.push('/dashboard')
  }

  const signup = async (email: string, password: string, name: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    })
    
    if (error) throw error
    router.push('/dashboard')
  }

  const loginWithProvider = async (provider: 'google' | 'github') => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    
    if (error) throw error
  }

  const logout = async () => {
    if (!supabase) return
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    setUser(null)
    router.push('/')
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    signup,
    loginWithProvider,
    logout,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}