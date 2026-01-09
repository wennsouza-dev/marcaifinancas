import React from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (mode: 'only' | 'all') => void;
    isRecurring: boolean;
}

const DeleteConfirmationModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, isRecurring }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl">delete</span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Transação</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        {isRecurring
                            ? "Esta é uma transação recorrente/parcelada. Como você deseja prosseguir?"
                            : "Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."}
                    </p>

                    <div className="flex flex-col gap-3">
                        {isRecurring ? (
                            <>
                                <button
                                    onClick={() => onConfirm('only')}
                                    className="w-full py-3 px-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">filter_1</span>
                                    Excluir Apenas Esta
                                </button>
                                <button
                                    onClick={() => onConfirm('all')}
                                    className="w-full py-3 px-4 bg-red-50 border border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-100 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">dynamic_feed</span>
                                    Excluir Esta e Futuras
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => onConfirm('only')}
                                className="w-full py-3 px-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                                Sim, Excluir
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-transparent text-gray-500 font-semibold hover:text-gray-700 transition-colors mt-2"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
