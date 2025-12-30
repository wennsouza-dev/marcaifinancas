
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  // Processing Logic
  const yearTransactions = transactions.filter(t => {
    const refDate = t.billing_date || t.date;
    return new Date(refDate + 'T00:00:00').getFullYear() === selectedYear;
  });

  const totalIncome = yearTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpenses = yearTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const annualBalance = totalIncome - totalExpenses;
  const monthlyAverage = totalIncome / 12; // Or based on months with data? Let's use 12 for annual average.

  // Monthly Evolution processing (12 months)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthTransactions = yearTransactions.filter(t => {
      const refDate = t.billing_date || t.date;
      return new Date(refDate + 'T00:00:00').getMonth() === i;
    });
    const income = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
    return { month: i, income, expense };
  });

  const maxVal = Math.max(...monthlyData.flatMap(d => [d.income, d.expense]), 1);

  // Category Breakdown
  const categories: Record<string, number> = {};
  yearTransactions.filter(t => t.type === 'expense').forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
  });

  const sortedCategories = Object.entries(categories)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(26, 96, 32); // Primary green
    doc.text('Relatório Financeiro MarcAI', 14, 22);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Período: Janeiro a Dezembro de ${selectedYear}`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 37);

    // Summary Boxes
    doc.setDrawColor(220);
    doc.rect(14, 45, 182, 35);
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Resumo Anual', 20, 55);

    doc.setFontSize(10);
    doc.text(`Total Receitas: R$ ${totalIncome.toLocaleString('pt-BR')}`, 20, 65);
    doc.text(`Total Despesas: R$ ${totalExpenses.toLocaleString('pt-BR')}`, 80, 65);
    doc.text(`Saldo Final: R$ ${annualBalance.toLocaleString('pt-BR')}`, 140, 65);

    // Monthly Table
    autoTable(doc, {
      startY: 90,
      head: [['Mês', 'Receitas', 'Despesas', 'Saldo']],
      body: monthlyData.map(d => [
        new Date(selectedYear, d.month).toLocaleString('pt-BR', { month: 'long' }),
        `R$ ${d.income.toLocaleString('pt-BR')}`,
        `R$ ${d.expense.toLocaleString('pt-BR')}`,
        `R$ ${(d.income - d.expense).toLocaleString('pt-BR')}`
      ]),
      theme: 'striped',
      headStyles: { fillColor: [26, 96, 32] }
    });

    // Category Table
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 15,
      head: [['Categoria', 'Valor Total', '% do Total']],
      body: sortedCategories.map(c => [
        c.name,
        `R$ ${c.amount.toLocaleString('pt-BR')}`,
        `${((c.amount / totalExpenses) * 100).toFixed(1)}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [76, 175, 80] }
    });

    doc.save(`Relatorio_Financeiro_${selectedYear}.pdf`);
  };

  const handleExportMonthlyPDF = (monthIndex: number) => {
    const monthData = monthlyData[monthIndex];
    const monthName = new Date(selectedYear, monthIndex).toLocaleString('pt-BR', { month: 'long' });
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(26, 96, 32);
    doc.text(`Relatório Mensal - ${monthName} ${selectedYear}`, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [['Categoria', 'Tipo', 'Valor', 'Data']],
      body: yearTransactions
        .filter(t => {
          const refDate = t.billing_date || t.date;
          return new Date(refDate + 'T00:00:00').getMonth() === monthIndex;
        })
        .map(t => [
          t.category,
          t.type === 'income' ? 'Receita' : 'Despesa',
          `R$ ${Number(t.amount).toLocaleString('pt-BR')}`,
          new Date(t.date).toLocaleDateString('pt-BR')
        ]),
      theme: 'grid',
      headStyles: { fillColor: [26, 96, 32] }
    });

    doc.save(`Relatorio_${monthName}_${selectedYear}.pdf`);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="animate-fade-in w-full max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8">
      {/* Page Heading & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-text-secondary text-sm font-medium mb-1">
            <span>Home</span>
            <span className="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
            <span className="text-primary">Relatórios</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">Relatórios Financeiros</h2>
          <p className="text-text-secondary dark:text-gray-400 mt-1 text-base">Análise detalhada de suas finanças de Janeiro a Dezembro {selectedYear}.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-surface-dark border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 shadow-sm">
            <span className="material-symbols-outlined text-gray-400 text-xl mr-2">calendar_month</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent border-none text-sm font-medium text-text-main dark:text-white focus:ring-0 p-0 pr-6 cursor-pointer outline-none"
            >
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y}>Ano de {y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-md shadow-primary/20 transition-all group"
          >
            <span className="material-symbols-outlined text-lg group-hover:animate-bounce">download</span>
            Exportar relatório
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <ReportSummary title="Total Receitas" value={`R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} trend="" icon="payments" color="primary" />
        <ReportSummary title="Média Mensal" value={`R$ ${monthlyAverage.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} trend="" icon="calendar_today" color="gray" />
        <ReportSummary title="Saldo Final" value={`R$ ${annualBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} trend="" icon="savings" color="success" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-text-main dark:text-white">Evolução Financeira Mensal</h3>
              <p className="text-sm text-text-secondary">Receitas vs. Despesas</p>
            </div>
          </div>
          <div className="flex-1 min-h-[300px] w-full relative">
            <div className="absolute inset-0 flex items-end justify-between px-2 gap-2 md:gap-4 pb-6">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 pr-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-full h-px bg-gray-100 dark:bg-gray-800"></div>)}
              </div>
              {monthlyData.map((d, i) => (
                <ReportBar
                  key={i}
                  primaryH={`${(d.income / maxVal) * 100}%`}
                  secondaryH={`${(d.expense / maxVal) * 100}%`}
                  month={new Date(selectedYear, d.month).toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
                  hideMobile={i > 5}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 justify-center">
            <LegendItem color="primary" text="Receitas" />
            <LegendItem color="secondary/40" text="Despesas" />
          </div>
        </div>

        {/* Category Pie Chart Simulation */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-text-main dark:text-white">Despesas por Categoria</h3>
            <p className="text-sm text-text-secondary">Onde seu dinheiro foi gasto</p>
          </div>
          {totalExpenses > 0 ? (
            <>
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-[240px]">
                <div className="relative h-48 w-48">
                  <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="40" stroke="#e9f1ea" strokeWidth="12"></circle>
                    {/* Simple visualization for the top categories */}
                    {sortedCategories.slice(0, 4).map((cat, i) => {
                      const percent = (cat.amount / totalExpenses) * 100;
                      const circumference = 2 * Math.PI * 40;
                      const offset = sortedCategories.slice(0, i).reduce((acc, c) => acc + (c.amount / totalExpenses) * circumference, 0);
                      const colors = ['#1a6020', '#4CAF50', '#81c784', '#c8e6c9'];
                      return (
                        <circle
                          key={i}
                          cx="50" cy="50" fill="none" r="40"
                          stroke={colors[i]}
                          strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
                          strokeDashoffset={-offset}
                          strokeWidth="12"
                        ></circle>
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold text-text-main dark:text-white">R$ {(totalExpenses / 1000).toFixed(1)}k</span>
                    <span className="text-xs text-text-secondary">Total Despesas</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {sortedCategories.slice(0, 4).map((cat, i) => (
                  <CategoryLegend
                    key={i}
                    color={['#1a6020', '#4CAF50', '#81c784', '#c8e6c9'][i]}
                    name={cat.name}
                    percent={`${((cat.amount / totalExpenses) * 100).toFixed(0)}%`}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic py-20">
              Nenhuma despesa no período.
            </div>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-surface-green/30 dark:bg-surface-green/5">
          <h3 className="font-bold text-text-main dark:text-white">Relatórios por Período ({selectedYear})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-white/5">
              <tr>
                <th className="px-6 py-3 font-semibold">Mês</th>
                <th className="px-6 py-3 font-semibold text-right">Receitas</th>
                <th className="px-6 py-3 font-semibold text-right">Despesas</th>
                <th className="px-6 py-3 font-semibold text-right">Saldo</th>
                <th className="px-6 py-3 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {monthlyData.filter(d => d.income > 0 || d.expense > 0).map((d, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-[#233b24] transition-colors">
                  <td className="px-6 py-4 font-medium text-text-main dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                    {new Date(selectedYear, d.month).toLocaleString('pt-BR', { month: 'long' })}
                  </td>
                  <td className="px-6 py-4 text-emerald-600 font-bold text-right">R$ {d.income.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-red-600 font-bold text-right">R$ {d.expense.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-text-main dark:text-white font-bold text-right">R$ {(d.income - d.expense).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleExportMonthlyPDF(d.month)}
                      className="text-primary hover:text-primary-hover font-medium hover:underline"
                    >
                      Exportar PDF
                    </button>
                  </td>
                </tr>
              ))}
              {monthlyData.filter(d => d.income > 0 || d.expense > 0).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">Nenhum dado disponível para este ano.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ReportSummary: React.FC<{ title: string, value: string, trend: string, icon: string, color: string }> = ({ title, value, trend, icon, color }) => {
  const iconColor = color === 'primary' ? 'text-primary bg-surface-green' : color === 'success' ? 'text-secondary bg-green-50' : 'text-gray-500 bg-gray-100';
  return (
    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 flex flex-col gap-4 relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <span className="material-symbols-outlined text-8xl">{icon}</span>
      </div>
      <div className="flex items-start justify-between z-10">
        <div className="flex flex-col gap-1">
          <p className="text-text-secondary text-sm font-medium">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${iconColor}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 text-sm font-medium z-10 ${color === 'primary' ? 'text-primary' : color === 'success' ? 'text-secondary' : 'text-text-secondary'}`}>
        <span className={`px-1.5 py-0.5 rounded text-xs flex items-center ${color === 'primary' ? 'bg-primary/10' : color === 'success' ? 'bg-secondary/10' : 'bg-gray-100'}`}>
          <span className="material-symbols-outlined text-sm mr-0.5">{trend.includes('+') ? 'trending_up' : 'remove'}</span>
          {trend}
        </span>
        <span className="text-text-secondary text-xs font-normal">{trend === 'estável' ? 'estável' : 'vs período anterior'}</span>
      </div>
    </div>
  );
};

const ReportBar: React.FC<{ primaryH: string, secondaryH: string, month: string, hideMobile?: boolean }> = ({ primaryH, secondaryH, month, hideMobile }) => (
  <div className={`flex flex-col items-center gap-2 group w-full h-full justify-end ${hideMobile ? 'hidden sm:flex' : 'flex'}`}>
    <div className="w-full max-w-[24px] rounded-t bg-primary group-hover:opacity-80 transition-opacity relative" style={{ height: primaryH }}></div>
    <div className="w-full max-w-[24px] rounded-t bg-secondary/40 group-hover:opacity-80 transition-opacity" style={{ height: secondaryH }}></div>
    <span className="text-xs font-medium text-text-secondary mt-2 absolute -bottom-1">{month}</span>
  </div>
);

const LegendItem: React.FC<{ color: string, text: string }> = ({ color, text }) => (
  <div className="flex items-center gap-2">
    <span className={`w-3 h-3 rounded-full bg-${color}`}></span>
    <span className="text-sm text-text-secondary">{text}</span>
  </div>
);

const CategoryLegend: React.FC<{ color: string, name: string, percent: string }> = ({ color, name, percent }) => (
  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
    <span className="text-sm font-medium text-text-main dark:text-gray-300">{name}</span>
    <span className="text-xs text-text-secondary ml-auto">{percent}</span>
  </div>
);

const ReportFileRow: React.FC<{ name: string, period: string, date: string, type: string }> = ({ name, period, date, type }) => (
  <tr className="hover:bg-gray-50 dark:hover:bg-[#233b24] transition-colors">
    <td className="px-6 py-4 font-medium text-text-main dark:text-white flex items-center gap-2">
      <span className={`material-symbols-outlined ${type === 'pdf' ? 'text-red-500' : 'text-green-600'}`}>
        {type === 'pdf' ? 'picture_as_pdf' : 'description'}
      </span>
      {name}
    </td>
    <td className="px-6 py-4 text-text-secondary">{period}</td>
    <td className="px-6 py-4 text-text-secondary">{date}</td>
    <td className="px-6 py-4 text-right">
      <button className="text-primary hover:text-primary-hover font-medium hover:underline">Baixar</button>
    </td>
  </tr>
);

export default Reports;
