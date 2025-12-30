import React, { useState, useEffect } from 'react';
import NewExpenseModal from '../components/NewExpenseModal';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const Transactions: React.FC = () => {
  const [showNewExpenseModal, setShowNewExpenseModal] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [filterType, setFilterType] = useState('todos'); // todos, income, expense

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const handleOpenModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setShowNewExpenseModal(true);
  };

  const handleSuccess = () => {
    fetchTransactions();
  };

  // Calculate stats
  const totalBalance = transactions.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todas' || t.category === filterCategory;
    const matchesType = filterType === 'todos' || t.type === filterType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto px-6 py-8 md:px-12 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Transações</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Gerencie suas entradas e saídas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleOpenModal('expense')}
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-expense text-white text-sm font-bold hover:bg-red-600 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">remove</span>
            Nova Despesa
          </button>
          <button
            onClick={() => handleOpenModal('income')}
            className="flex items-center gap-2 h-10 px-5 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nova Receita
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">account_balance_wallet</span>
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Saldo Total</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-text-main dark:text-white">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">arrow_upward</span>
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Entradas</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-expense">arrow_downward</span>
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Saídas</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-expense">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            type="text"
            placeholder="Buscar transações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main dark:text-white"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main dark:text-white"
        >
          <option value="Todas">Todas as Categorias</option>
          <option value="Alimentação">Alimentação</option>
          <option value="Transporte">Transporte</option>
          <option value="Lazer">Lazer</option>
          <option value="Eletrônicos">Eletrônicos</option>
          <option value="Outros">Outros</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main dark:text-white"
        >
          <option value="todos">Todos os Tipos</option>
          <option value="income">Entradas</option>
          <option value="expense">Saídas</option>
        </select>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Carregando transações...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma transação encontrada.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-expense'
                          }`}>
                          <span className="material-symbols-outlined">
                            {t.type === 'income' ? 'attach_money' : 'receipt_long'}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-text-main dark:text-white">{t.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-expense'
                      }`}>
                      {t.type === 'income' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="material-symbols-outlined text-emerald-500 text-[20px]" title="Concluído">check_circle</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewExpenseModal && (
        <NewExpenseModal
          onClose={() => setShowNewExpenseModal(false)}
          type={modalType}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default Transactions;
