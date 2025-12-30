
import React, { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../supabaseClient'
import { Session, User } from '@supabase/supabase-js'

export interface UserProfile {
    id: string
    email: string
    name: string
    role: 'admin' | 'user'
    expiration_date: string | null
}

interface AuthContextType {
    session: Session | null
    user: User | null
    profile: UserProfile | null
    loading: boolean
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (email: string | undefined) => {
        if (!email) {
            setProfile(null)
            return
        }

        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('email', email)
                .single()

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error)
            }

            setProfile(data)
        } catch (err) {
            console.error('Unexpected error fetching profile:', err)
            setProfile(null)
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user?.email) {
                fetchProfile(session.user.email).then(() => setLoading(false))
            } else {
                setLoading(false)
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user?.email) {
                // Only fetch if session changed significantly, but for simplicity we fetch to ensure freshness
                fetchProfile(session.user.email)
            } else {
                setProfile(null)
            }
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const signOut = async () => {
        await supabase.auth.signOut()
        setProfile(null)
        setSession(null)
        setUser(null)
    }

    const refreshProfile = async () => {
        if (user?.email) {
            await fetchProfile(user.email)
        }
    }

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
