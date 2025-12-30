import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                    <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl w-full border border-red-100">
                        <h1 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">error</span>
                            Algo deu errado
                        </h1>
                        <p className="text-gray-600 mb-4">Ocorreu um erro ao renderizar a aplicação.</p>
                        <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                            <p className="font-mono text-sm text-red-800 whitespace-pre-wrap">
                                {this.state.error?.toString()}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            Voltar para Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
