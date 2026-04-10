'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (typeof window !== 'undefined') return window.location.origin
  return ''
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

  const mountedRef = useRef(true)
  const initDoneRef = useRef(false)

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[Auth] Error fetching profile:', error.message)
        return null
      }
      return data as Profile
    } catch (err) {
      console.error('[Auth] Profile fetch exception:', err)
      return null
    }
  }, [supabase])

  const setAuthState = useCallback(async (session: Session | null) => {
    if (!mountedRef.current) return

    if (session?.user) {
      const profile = await fetchProfile(session.user.id)
      if (!mountedRef.current) return
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
      setState({ ...DEFAULT_STATE, isLoading: false })
    }
  }, [fetchProfile])

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user || !mountedRef.current) return
    const profile = await fetchProfile(session.user.id)
    if (profile && mountedRef.current) {
      setState(prev => ({
        ...prev,
        profile,
        isAdmin: profile.role === 'admin',
        role: profile.role,
      }))
    }
  }, [supabase, fetchProfile])

  useEffect(() => {
    mountedRef.current = true
    initDoneRef.current = false

    // Safety timeout — if auth takes too long, stop blocking the UI
    const timeout = setTimeout(() => {
      if (mountedRef.current && !initDoneRef.current) {
        console.warn('[Auth] Init timed out after 5s')
        setState(prev => prev.isLoading ? { ...prev, isLoading: false } : prev)
      }
    }, 5000)

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      initDoneRef.current = true
      await setAuthState(session)
    }).catch((err: unknown) => {
      console.error('[Auth] getSession failed:', err)
      initDoneRef.current = true
      if (mountedRef.current) {
        setState(prev => ({ ...prev, isLoading: false }))
      }
    })

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        // Skip INITIAL_SESSION since we handle it above via getSession
        if (event === 'INITIAL_SESSION') return
        await setAuthState(session)
      }
    )

    return () => {
      mountedRef.current = false
      clearTimeout(timeout)
      subscription.unsubscribe()
    }
  }, [supabase, setAuthState])

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${getBaseUrl()}/auth/callback`,
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
        redirectTo: `${getBaseUrl()}/auth/callback`,
      },
    })
    return { error: error?.message ?? null }
  }

  const signInWithMagicLink = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/callback`,
      },
    })
    return { error: error?.message ?? null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getBaseUrl()}/auth/callback?next=/perfil/seguranca`,
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
    // Clear local state immediately to avoid stale UI
    setState({ ...DEFAULT_STATE, isLoading: false })
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[Auth] signOut error:', err)
    }
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
