
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
                if (error.code === 'PGRST116' && userId) {
                    // Profile missing. Check Whitelist logic.

                    // 1. Check if user is Super Admin (Hardcoded bypass for initial setup)
                    if (email === 'wennsouza@gmail.com') {
                        const newProfile: UserProfile = {
                            id: userId,
                            email: email,
                            name: 'Admin',
                            role: 'admin',
                            expiration_date: null
                        }
                        const { data: inserted, error: insErr } = await supabase.from('user_profiles').insert([newProfile]).select().single();
                        if (!insErr) setProfile(inserted);
                        else setProfile(null);
                        return;
                    }

                    // 2. Check Whitelist
                    const { data: whitelistData } = await supabase
                        .from('access_whitelist')
                        .select('*')
                        .eq('email', email)
                        .single();

                    if (whitelistData) {
                        // User is whitelisted! Create Profile.
                        const newProfile: UserProfile = {
                            id: userId,
                            email: email,
                            name: whitelistData.name || email.split('@')[0],
                            role: whitelistData.role || 'user',
                            expiration_date: whitelistData.expiration_date
                        }

                        const { data: inserted, error: insErr } = await supabase
                            .from('user_profiles')
                            .insert([newProfile])
                            .select()
                            .single();

                        if (insErr) {
                            console.error('Error creating profile from whitelist:', insErr);
                            setProfile(null);
                        } else {
                            setProfile(inserted);
                        }
                    } else {
                        // Not whitelisted -> Access Denied
                        setProfile(null);
                    }
                } else {
                    console.error('Error fetching profile:', error)
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
