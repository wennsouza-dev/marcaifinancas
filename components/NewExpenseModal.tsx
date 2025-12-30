
import React, { useState } from 'react';

interface Props {
  onClose: () => void;
}

const NewExpenseModal: React.FC<Props> = ({ onClose }) => {
  const [isInstallment, setIsInstallment] = useState(true);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-white/10 animate-fade-in">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-expense">remove_circle</span>
            Nova Despesa
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Descrição</label>
              <input className="w-full px-3 py-2.5 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white placeholder-gray-400" placeholder="Ex: Compra de Notebook" type="text"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Valor Total</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 text-sm">R$</span>
                <input className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="0,00" type="text" defaultValue="3.500,00"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Data</label>
              <input className="w-full px-3 py-2.5 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" type="date"/>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide">Categoria</label>
              <select className="w-full px-3 py-2.5 bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none">
                <option>Eletrônicos</option>
                <option>Alimentação</option>
                <option>Transporte</option>
                <option>Lazer</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-dashed border-gray-200 dark:border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                  checked={isInstallment} 
                  onChange={() => setIsInstallment(!isInstallment)}
                  className="absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-primary peer transition-all duration-200 left-0" 
                  id="toggle-installment" 
                  type="checkbox"
                />
                <label className="block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer peer-checked:bg-primary/50" htmlFor="toggle-installment"></label>
              </div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer select-none" htmlFor="toggle-installment">
                Compra parcelada (Cartão de Crédito)
              </label>
            </div>
            
            {isInstallment && (
              <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 border border-primary/10 space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Parcela Atual</label>
                    <div className="relative">
                      <input className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white" min="1" type="number" defaultValue="1"/>
                      <span className="absolute right-3 top-2 text-xs text-gray-400 pointer-events-none mt-0.5">º mês</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Total de Parcelas</label>
                    <div className="relative">
                      <input className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-gray-200 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white" min="1" type="number" defaultValue="10"/>
                      <span className="absolute right-3 top-2 text-xs text-gray-400 pointer-events-none mt-0.5">x</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white dark:bg-background-dark rounded-lg p-3 border border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Simulação de Parcelas</span>
                    <span className="text-xs font-bold text-expense">R$ 350,00 / mês</span>
                  </div>
                  <div className="space-y-2">
                    <SimulationLine label="Nov 2023" installment="1/10" active />
                    <SimulationLine label="Dez 2023" installment="2/10" />
                    <SimulationLine label="Jan 2024" installment="3/10" />
                    <div className="text-[10px] text-center text-gray-400 pt-1 italic">
                      + 7 parcelas restantes nos meses seguintes
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors">Cancelar</button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md shadow-primary/20 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check</span>
            Salvar Despesa
          </button>
        </div>
      </div>
    </div>
  );
};

const SimulationLine: React.FC<{ label: string, installment: string, active?: boolean }> = ({ label, installment, active }) => (
  <div className={`flex items-center text-xs ${active ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
    <div className={`w-2 h-2 rounded-full mr-2 ${active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
    <span className="font-medium w-16">{label}</span>
    <span className="flex-1 border-b border-dashed border-gray-200 dark:border-white/10 mx-2"></span>
    <span>{installment}</span>
  </div>
);

export default NewExpenseModal;
