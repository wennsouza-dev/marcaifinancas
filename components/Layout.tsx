
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (p: string) => path === p;

  const { profile } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Transações', path: '/transactions', icon: 'receipt_long' },
    { label: 'Dividir Gastos', path: '/split', icon: 'call_split' },
    { label: 'Importar (Beta)', path: '/smart-import', icon: 'upload_file' },


    { label: 'Relatórios', path: '/reports', icon: 'pie_chart' },
    { label: 'Configurações', path: '/settings', icon: 'settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 pt-[env(safe-area-inset-top)]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-emerald-700">
            <div className="size-8 md:size-10 flex items-center justify-center bg-emerald-100 rounded-lg text-emerald-700 shrink-0">
              <span className="material-symbols-outlined text-xl md:text-2xl">account_balance_wallet</span>
            </div>
            <h1 className="text-emerald-800 dark:text-white text-lg md:text-xl font-bold leading-tight tracking-tight line-clamp-1">MarcAI Finanças</h1>
          </div>

          <nav className="hidden md:flex flex-1 justify-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${isActive(item.path)
                  ? 'text-primary dark:text-primary-light font-bold border-b-2 border-primary'
                  : 'text-text-main dark:text-white'
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative flex items-center justify-center size-9 md:size-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-text-main dark:text-white">
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-danger rounded-full border-2 border-white dark:border-background-dark"></span>
            </button>

            <div className="hidden sm:flex items-center gap-3 cursor-pointer group" onClick={() => (window.location.href = '/#/settings')}>
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-text-main dark:text-white group-hover:text-primary transition-colors">{profile?.name || 'Carregando...'}</span>
                <span className="text-xs text-gray-500 capitalize">{profile?.role === 'admin' ? 'Administrador' : 'Plano Premium'}</span>
              </div>
              <div
                className="size-10 rounded-full bg-cover bg-center border-2 border-primary/20 bg-emerald-50 flex items-center justify-center overflow-hidden"
              >
                {profile?.name ? (
                  <span className="text-emerald-700 font-bold text-lg">{profile.name.charAt(0).toUpperCase()}</span>
                ) : (
                  <span className="material-symbols-outlined text-gray-400">person</span>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                supabase.auth.signOut().then(() => window.location.href = '/');
              }}
              className="flex items-center justify-center size-9 md:size-10 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <span className="material-symbols-outlined text-[20px] md:text-[24px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Footer Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-200 dark:border-white/10 flex items-center justify-around pb-[calc(env(safe-area-inset-bottom)+8px)] pt-3 px-2 z-50">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center gap-1 transition-all ${isActive(item.path)
              ? 'text-primary scale-110'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500'
              }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${isActive(item.path) ? 'filled' : ''}`}>{item.icon}</span>
            <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
          </Link>
        ))}
      </nav>

      <footer className="hidden md:block py-6 text-center text-sm text-gray-400 dark:text-gray-600">
        © 2024 MarcAI Finanças. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default Layout;
