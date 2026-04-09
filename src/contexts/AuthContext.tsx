'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile, UserRole } from '@/types/auth'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  role: UserRole
}

type OAuthProvider = 'google' | 'facebook' | 'apple'

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: string | null }>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const DEFAULT_STATE: AuthState = {
  user: null,
  profile: null,
  session: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: false,
  role: 'user',
}

const AuthContext = createContext<AuthContextValue | null>(null)

const noopAsync = async () => ({ error: 'Supabase not configured' as string | null })

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()

  // If Supabase isn't configured (e.g. during build/prerender), render children with default state
  if (!supabase) {
    return (
      <AuthContext.Provider
        value={{
          ...DEFAULT_STATE,
          signUp: async () => noopAsync(),
          signInWithPassword: async () => noopAsync(),
          signInWithMagicLink: async () => noopAsync(),
          signInWithOAuth: async () => noopAsync(),
          resetPassword: async () => noopAsync(),
          updatePassword: async () => noopAsync(),
          signOut: async () => {},
          refreshProfile: async () => {},
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return <AuthProviderInner supabase={supabase}>{children}</AuthProviderInner>
}

function AuthProviderInner({
  children,
  supabase,
}: {
  children: ReactNode
  supabase: NonNullable<ReturnType<typeof createClient>>
}) {
  const [state, setState] = useState<AuthState>({
    ...DEFAULT_STATE,
    isLoading: true,
  })

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error.message)
      return null
    }
    return data as Profile
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return
    const profile = await fetchProfile(state.user.id)
    if (profile) {
      setState(prev => ({
        ...prev,
        profile,
        isAdmin: profile.role === 'admin',
        role: profile.role,
      }))
    }
  }, [state.user, fetchProfile])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: session.user,
          profile,
          session,
          isAuthenticated: true,
          isAdmin: profile?.role === 'admin',
          isLoading: false,
          role: profile?.role ?? 'user',
        })
      } else {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({
            user: session.user,
            profile,
            session,
            isAuthenticated: true,
            isAdmin: profile?.role === 'admin',
            isLoading: false,
            role: profile?.role ?? 'user',
          })
        } else {
          setState({
            ...DEFAULT_STATE,
            isLoading: false,
          })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error?.message ?? null }
  }

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signInWithOAuth = async (provider: OAuthProvider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error?.message ?? null }
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error?.message ?? null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/perfil/seguranca`,
    })
    return { error: error?.message ?? null }
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error && state.user) {
      await supabase
        .from('profiles')
        .update({ has_password_set: true })
        .eq('id', state.user.id)
    }
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signInWithPassword,
        signInWithMagicLink,
        signInWithOAuth,
        resetPassword,
        updatePassword,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
