
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

    const fetchProfile = async (email: string | undefined, userId: string | undefined) => {
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

            if (error) {
                if (error.code === 'PGRST116' && userId && email === 'wennsouza@gmail.com') {
                    // Special case: valid admin user, create profile if missing
                    const newProfile: UserProfile = {
                        id: userId,
                        email: email,
                        name: 'Admin',
                        role: 'admin',
                        expiration_date: null // Admin never expires
                    }

                    const { data: insertedData, error: insertError } = await supabase
                        .from('user_profiles')
                        .insert([newProfile])
                        .select()
                        .single()

                    if (insertError) {
                        console.error('Error creating admin profile:', insertError)
                        setProfile(null)
                    } else {
                        setProfile(insertedData)
                    }
                } else {
                    // Profile doesn't exist and not the super admin -> Access Denied (profile is null)
                    setProfile(null)
                }
            } else {
                setProfile(data)
            }
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
                fetchProfile(session.user.email, session.user.id).then(() => setLoading(false))
            } else {
                setLoading(false)
            }
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user?.email) {
                // Only fetch if session changed significantly, but for simplicity we fetch to ensure freshness
                fetchProfile(session.user.email, session.user.id)
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
            await fetchProfile(user.email, user.id)
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
