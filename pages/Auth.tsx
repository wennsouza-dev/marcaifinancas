
import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const [rememberMe, setRememberMe] = useState(false)
    const navigate = useNavigate()
    const { session } = useAuth()

    React.useEffect(() => {
        const savedEmail = localStorage.getItem('marcai_saved_email')
        const savedPassword = localStorage.getItem('marcai_saved_password')
        if (savedEmail && savedPassword) {
            setEmail(savedEmail)
            setPassword(savedPassword)
            setRememberMe(true)
        }
    }, [])

    React.useEffect(() => {
        if (session) {
            navigate('/dashboard')
        }
    }, [session, navigate])

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setMessage(null)

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error

                if (rememberMe) {
                    localStorage.setItem('marcai_saved_email', email)
                    localStorage.setItem('marcai_saved_password', password)
                } else {
                    localStorage.removeItem('marcai_saved_email')
                    localStorage.removeItem('marcai_saved_password')
                }

                navigate('/dashboard')
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                })
                if (error) throw error
                setMessage('Verifique seu e-mail para o link de confirmação!')
            }
        } catch (error: any) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">MarcAI Finanças</h1>
                    <p className="text-gray-500">
                        {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Senha
                        </label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {isLogin && (
                        <div className="flex items-center">
                            <input
                                id="remember_me"
                                name="remember_me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
                                Manter conectado
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Cadastrar')}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-emerald-600 hover:text-emerald-800 font-medium hover:underline"
                    >
                        {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
                    </button>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-gray-500 text-xs mb-3 font-medium uppercase tracking-wider">Acesso para Amigos</p>
                        <button
                            type="button"
                            onClick={() => navigate('/shared-login')}
                            className="w-full flex justify-center items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-3 rounded-lg border border-indigo-200 transition-colors"
                        >
                            <span className="material-symbols-outlined">group</span>
                            GASTOS COMPARTILHADOS
                        </button>
                    </div>

                    <div className="mt-6">
                        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600 text-sm">
                            ← Voltar para Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Auth
