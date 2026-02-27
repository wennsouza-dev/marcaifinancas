import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    reloaded: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        reloaded: false,
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Auto-reload ONCE when a lazy-loaded chunk cannot be fetched (stale Vercel deploy)
        const isChunkError = (
            error.message?.includes('Failed to fetch dynamically imported module') ||
            error.message?.includes('Importing a module script failed') ||
            error.name === 'ChunkLoadError'
        );

        if (isChunkError && !this.state.reloaded) {
            this.setState({ reloaded: true });
            // Small delay so the error boundary state is saved, then hard-reload
            setTimeout(() => window.location.reload(), 300);
        }
    }

    public render() {
        const isChunkError = (
            this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
            this.state.error?.message?.includes('Importing a module script failed') ||
            this.state.error?.name === 'ChunkLoadError'
        );

        if (this.state.hasError) {
            // For chunk errors, show a minimal "reloading" screen instead of the full error
            if (isChunkError) {
                return (
                    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 gap-4">
                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-600 text-sm font-medium">Atualizando aplicação...</p>
                    </div>
                );
            }

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
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                            >
                                Tentar novamente
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Voltar para Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
