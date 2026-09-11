/* oxlint-disable react/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchProfile = async (userId) => {
      if (!userId) {
        if (isMounted) setProfile(null)
        return null
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!isMounted) return null

        if (error) {
          console.error('Error fetching profile:', error)
          setProfile(null)
          return null
        }

        setProfile(data)
        return data
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching profile:', err)
          setProfile(null)
        }
        return null
      }
    }

    // On mount calls supabase.auth.getSession() and stores the session's user in state,
    // and also fetches the matching row from profiles (by id) into a profile state value.
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
      }

      if (!isMounted) return

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }

      if (isMounted) {
        setLoading(false)
      }
    }).catch((err) => {
      if (isMounted) {
        console.error('Error getting session:', err)
        setLoading(false)
      }
    })

    // Subscribes to supabase.auth.onAuthStateChange to keep user and profile in sync.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null)
        }

        if (isMounted) {
          setLoading(false)
        }
      }
    )

    // Unsubscribes from the listener on unmount.
    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signUp = (email, password, name) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })
  }

  const signOut = () => {
    return supabase.auth.signOut()
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  return useContext(AuthContext)
}

export default AuthContext
