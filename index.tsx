
import React, { useState, useEffect, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import ErrorBoundary from './components/ErrorBoundary';

// Check for Critical Environment Variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isConfigured = supabaseUrl && supabaseKey;

// Lazy load App so SupabaseClient (which is imported by App) doesn't crash immediately if keys are missing
const App = React.lazy(() => import('./App'));

const ConfigError = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
    <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 border border-red-100 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="material-symbols-outlined text-3xl text-red-600">settings_alert</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuração Necessária</h1>
      <p className="text-gray-600 mb-6 leading-relaxed">
        A aplicação não conseguiu encontrar as chaves de conexão. Isso geralmente acontece em novos deployments na Vercel.
      </p>

      <div className="bg-gray-900 text-gray-200 text-left p-4 rounded-lg text-xs font-mono mb-6 overflow-x-auto">
        <p className="mb-2 text-gray-400">// Adicione estas variáveis no painel da Vercel:</p>
        <p><span className="text-emerald-400">VITE_SUPABASE_URL</span>=...</p>
        <p><span className="text-emerald-400">VITE_SUPABASE_ANON_KEY</span>=...</p>
      </div>

      <a
        href="https://vercel.com/dashboard"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-black transition-all hover:scale-[1.02]"
      >
        Ir para Vercel Dashboard
      </a>
    </div>
  </div>
);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      {isConfigured ? (
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        }>
          <App />
        </Suspense>
      ) : (
        <ConfigError />
      )}
    </ErrorBoundary>
  </React.StrictMode>
);
