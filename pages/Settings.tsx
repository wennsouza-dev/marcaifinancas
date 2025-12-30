import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import Admin from './Admin'; // We can keep using Admin component if it exists, or replace the content.
// Since I haven't seen Admin.tsx content, I'll assume users want the specific form described.
// It's safer to implement the specific Admin form here or inside Admin.tsx.
// Let's implement the specific Admin UI section here to be sure.

const Settings: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);

  // Admin Form State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [expirationDays, setExpirationDays] = useState('30');
  const [creatingUser, setCreatingUser] = useState(false);
  const [msg, setMsg] = useState('');

  const isSuperAdmin = user?.email === 'wennsouza@gmail.com';

  const handleUpdateName = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ name })
        .eq('id', user.id);

      if (error) throw error;
      await refreshProfile();
      // Optional: Show success feedback
    } catch (error) {
      console.error("Error updating name:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingUser(true);
    setMsg('');

    try {
      // 1. Check if profile exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', newUserEmail)
        .single();

      if (existing) {
        setMsg('Erro: Usuário já possui perfil.');
        return;
      }

      // 2. Insert new profile
      // Note: The ID is tricky because usually ID matches auth.users.id.
      // If we want to pre-approve, we might need a way to link them.
      // Option A: We create a row with a placeholder ID or just Email and let the trigger handle it?
      // But RLS relies on ID.
      // The previous AuthContext logic "auto-created" the profile using the user's ID upon login.
      // To "Authorize" ahead of time, we normally insert into a distinct "whitelist" table OR we need the user's ID.
      // BUT, since we don't know the ID before they sign up with Auth provider.
      // STRATEGY CHANGE: We should insert into a 'allowed_users' table? Or just create a profile?
      // IF Supabase Auth is used, the User ID is generated on Sign Up.
      // The user request implies "Register user".
      // If the user already signed up but got "Pending", their profile might be missing or limited.
      // If they haven't signed up, we can't create a profile linked to an ID we don't have.

      // Let's assume the flow: User Signs Up -> Gets "Access Pending" -> Admin sees them (or adds them).
      // OR: Admin adds Email to "Whitelist".

      // Given the previous AuthContext had logic: "If error Padmin... create profile".
      // It seems the app relies on `user_profiles` table.
      // Let's look at `AuthContext.tsx` again.
      // It fetches by `email` AND `userId`.
      // If I insert a row with a RANDOM UUID, it won't match the future user's Real UUID.

      // CORRECTION: The Admin likely needs to Approve EXISTING pending users or Invite new ones.
      // However, user said "cadastrar usuarios com email...".
      // Only way to work with RLS and Auth is if we have an "Invited Users" table, and when they login, we check that table.
      // Let's CREATE a simple 'authorized_emails' table or logic.
      // OR, simpler: Just insert into `user_profiles` with a TEMPORARY ID? No, that breaks relations.

      // BEST APPROACH for "Pre-registering":
      // 1. Admin enters Email.
      // 2. App stores this in `user_profiles` with `id` = some_placeholder? No.
      // 3. App stores this in a NEW `authorized_users` table: email, name, days.
      // 4. `AuthContext` check: When user logs in, check `authorized_users`. If match, COPY data to `user_profiles` and delete from authorized.

      // WAIT: The previous code had "Pending Access" screen.
      // That screen appeared if `profile` was null.
      // This means the user is Logged In (Auth exists) but Profile doesn't.
      // So the Admin should likely find the user by Email and CREATE the profile using the valid ID?
      // But how does Admin know the ID?
      // Admin can only see `user_profiles`. If profile doesn't exist, Admin can't see them.

      // OK, simplest fix given constraints and "White Screen" risk:
      // Use a "whitelist" mechanism.
      // Create table `access_whitelist` (email, name, expiration_days).
      // Updates `AuthContext` to check this table when creating the profile.

      // For now, to unblock the Admin UI request, I will create the UI to insert into a generic 'access_whitelist' table I will create.
      // And I will update AuthContext to look at it.

      // Let's Create the table first via SQL tool?
      // Or better: Does `user_profiles` allow null ID? No, PK.

      // Alternative: Admin only "Unblocks" users who have already tried to login?
      // User asked to "Cadastrar".

      // I will implement the UI assuming a `whitelist` table exists (I'll create it next).

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expirationDays));

      const { error } = await supabase
        .from('access_whitelist')
        .insert([{
          email: newUserEmail,
          name: newUserName,
          role: 'user',
          expiration_date: expirationDate.toISOString()
        }]);

      if (error) throw error;
      setMsg('Usuário pré-cadastrado com sucesso!');
      setNewUserEmail('');
      setNewUserName('');
    } catch (err) {
      setMsg('Erro ao cadastrar.');
      console.error(err);
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8 md:px-12 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Configurações</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Gerencie sua conta e preferências de visualização</p>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="mb-12 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20">
            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">admin_panel_settings</span>
            <h2 className="text-purple-900 dark:text-purple-100 text-lg font-bold">Painel Administrativo (Super Admin)</h2>
          </div>
          <div className="p-6">
            <h3 className="text-md font-bold text-text-main dark:text-white mb-4">Cadastrar Novo Usuário</h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-secondary">Email</span>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="h-11 px-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                  placeholder="usuario@email.com"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-secondary">Nome</span>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="h-11 px-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                  placeholder="Nome do usuário"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-text-secondary">Dias para Expirar</span>
                <select
                  value={expirationDays}
                  onChange={e => setExpirationDays(e.target.value)}
                  className="h-11 px-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
                >
                  <option value="7">7 dias (Teste)</option>
                  <option value="30">30 dias</option>
                  <option value="90">3 meses</option>
                  <option value="365">1 ano</option>
                </select>
              </label>
              <button
                disabled={creatingUser}
                className="h-11 px-6 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {creatingUser ? 'Salvando...' : 'Cadastrar'}
              </button>
            </form>
            {msg && <p className={`mt-3 text-sm ${msg.includes('Erro') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
              <Admin />
            </div>
          </div>
        </div>
      )}

      {/* User Data Section - Limited for Non-Admins */}
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
                <input
                  className="w-full h-12 px-4 rounded-lg bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 text-text-main dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">edit</span>
              </div>
            </label>
            {/* Email Read-Only */}
            <label className="flex flex-col gap-1.5 opacity-60">
              <span className="text-text-main dark:text-gray-200 text-sm font-medium">Email</span>
              <div className="relative">
                <input
                  className="w-full h-12 px-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-text-main dark:text-white placeholder-gray-400 focus:outline-none cursor-not-allowed"
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">lock</span>
              </div>
            </label>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={handleUpdateName}
              disabled={saving}
              className="flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors shadow-sm ml-auto disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Section - Helper Text Only */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-12 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          <h2 className="text-text-main text-lg font-bold leading-tight">Preferências</h2>
        </div>
        <div className="p-6 flex flex-col gap-6">
          {/* Dark Mode toggle removed as per request */}
          <p className="text-gray-500">O tema padrão do sistema é Claro.</p>
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
