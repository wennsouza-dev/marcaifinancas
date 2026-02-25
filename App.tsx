
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SplitExpenses from './pages/SplitExpenses';
import Layout from './components/Layout';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import Landing from './pages/Landing';
import { AuthProvider, useAuth } from './context/AuthContext';


const ProtectedRoute = () => {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) return <div>Carregando...</div>;

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Super Admin Bypass
  if (session.user.email === 'wennsouza@gmail.com') {
    return <Outlet />;
  }

  // Access Control Logic
  if (profile) {
    if (profile.expiration_date) {
      const expiration = new Date(profile.expiration_date);
      const now = new Date();
      if (now > expiration && profile.role !== 'admin') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Acesso Expirado</h2>
              <p className="text-gray-600 mb-6">Sua assinatura expirou em {expiration.toLocaleDateString()}. Entre em contato com o administrador para renovar.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => window.location.reload()} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors">Verificar Novamente</button>
                <button onClick={signOut} className="text-gray-500 hover:text-gray-700 underline">Sair</button>
              </div>
            </div>
          </div>
        )
      }
    }
  } else {
    // If profile doesn't exist yet but user is logged in (could happen if admin hasn't created profile yet)
    // OR if fetch failed.
    // Based on requirements: "Se não cadastrado no painel administrativo, não haverá acesso."
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold text-emerald-600 mb-4">Acesso Pendente</h2>
          <p className="text-gray-600 mb-6">Seu e-mail não está autorizado. Solicite acesso ao administrador.</p>
          <div className="flex flex-col gap-3">
            <button onClick={() => window.location.reload()} className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition-colors">Verificar Novamente</button>
            <button onClick={signOut} className="text-gray-500 hover:text-gray-700 underline">Sair da Conta</button>
            <button onClick={() => window.location.href = '/'} className="mt-2 text-sm text-emerald-600 hover:text-emerald-800">Voltar para Home</button>
          </div>
        </div>
      </div>
    )
  }

  return <Outlet />;
};


const App: React.FC = () => {
  React.useEffect(() => {
    // Enforce Light Mode
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Admin />} />

            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/split" element={<SplitExpenses />} />
              <Route path="/settings" element={<Settings />} />
              {/* Default redirect if user hits root authorized */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
            {/* Redirect legacy / path if user is logged in? 
            For now, let's keep it simple. If they go to /, they see landing. 
            Auth.tsx should redirect to /dashboard. 
            */}
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};


export default App;
