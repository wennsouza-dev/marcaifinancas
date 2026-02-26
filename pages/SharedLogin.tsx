import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SharedLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail) return;

        setLoading(true);
        // We simply store the email and navigate to the shared dashboard.
        // The dashboard will query the DB using this email via the secure RPC function.
        localStorage.setItem('shared_friend_email', trimmedEmail);

        // Simulate a small delay for better UX
        setTimeout(() => {
            setLoading(false);
            navigate('/shared-dashboard');
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Gastos Compartilhados</h1>
                    <p className="text-gray-500">
                        Acesse seus rateios apenas informando o seu E-mail.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors dark:text-gray-900 font-medium"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email.trim()}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/25"
                    >
                        {loading ? 'Acessando...' : 'Acessar Meus Gastos'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <button onClick={() => navigate('/auth')} className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                        ← Voltar para o Login Principal
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharedLogin;
