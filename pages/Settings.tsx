import React from 'react';
import { useAuth } from '../context/AuthContext';
import Admin from './Admin';

const Settings: React.FC = () => {
  const { user } = useAuth();

  const isSuperAdmin = user?.email === 'wennsouza@gmail.com';

  return (
    <div className="animate-fade-in w-full max-w-5xl mx-auto px-6 py-8 md:px-12 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Configurações</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Gerencie sua conta e preferências de visualização</p>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="mb-12">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 rounded-t-xl mx-0">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">admin_panel_settings</span>
            <h2 className="text-purple-900 dark:text-purple-100 text-lg font-bold leading-tight">Painel Administrativo</h2>
          </div>
          <div className="bg-white dark:bg-surface-dark border border-t-0 border-gray-200 dark:border-white/5 rounded-b-xl shadow-sm overflow-hidden">
            <Admin />
          </div>
        </div>
      )}

      {/* User Data Section */}
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-white/5 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-green-400">person</span>
          <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight">Dados do usuário</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <label className="flex flex-col gap-1.5">
              <span className="text-text-main dark:text-gray-200 text-sm font-medium">Nome Completo</span>
              <div className="relative">
                <input className="w-full h-12 px-4 rounded-lg bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 text-text-main dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" type="text" defaultValue="Marco Silva" />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">edit</span>
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-text-main dark:text-gray-200 text-sm font-medium">Email</span>
              <div className="relative">
                <input className="w-full h-12 px-4 rounded-lg bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 text-text-main dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" type="email" defaultValue="marco@exemplo.com" />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">mail</span>
              </div>
            </label>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <button className="flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary dark:text-green-400 text-sm font-bold hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-lg">lock_reset</span>
              Alterar Senha
            </button>
            <button className="flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm ml-auto">
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-white/5 mb-12 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary dark:text-green-400">tune</span>
          <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight">Preferências de visualização</h2>
        </div>
        <div className="p-6 flex flex-col gap-6">
          <ToggleItem
            icon="dark_mode"
            title="Modo Escuro"
            description="Alternar entre tema claro e escuro"
            checked={false}
          />
          <ToggleItem
            icon="notifications"
            title="Notificações por Email"
            description="Receba resumos semanais"
            checked={true}
          />
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col items-center justify-center pt-8 border-t border-gray-100 dark:border-white/10">
        <p className="text-sm font-medium text-gray-400 dark:text-gray-500 text-center">
          MarcAI Finanças – Seu controle financeiro inteligente
        </p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">Versão 2.4.0</p>
      </div>
    </div>
  );
};

const ToggleItem: React.FC<{ icon: string, title: string, description: string, checked: boolean }> = ({ icon, title, description, checked }) => (
  <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-background-dark">
    <div className="flex gap-4 items-center">
      <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-dark flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/10">
        <span className="material-symbols-outlined text-text-main dark:text-white">{icon}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-text-main dark:text-white font-semibold">{title}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{description}</span>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input className="sr-only peer" type="checkbox" defaultChecked={checked} />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
    </label>
  </div>
);

export default Settings;
