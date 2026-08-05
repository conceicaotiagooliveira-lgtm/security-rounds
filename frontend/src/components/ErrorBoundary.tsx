import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Check if it's a chunk load error (common after PWA updates)
    const isChunkLoadError = 
      error.name === 'ChunkLoadError' || 
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Importing a module script failed');

    if (isChunkLoadError) {
      // Clear cache and force reload
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach(name => {
            caches.delete(name);
          });
        }).finally(() => {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Atualização Necessária</h2>
            <p className="text-slate-600 mb-6 text-sm">
              O sistema foi atualizado recentemente e encontrou um conflito de versão. 
              Para resolver isso, precisamos recarregar o aplicativo.
            </p>
            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 rounded text-left overflow-auto text-xs text-red-600">
                <strong>Error:</strong> {this.state.error.toString()}
                <br />
                {this.state.error.stack}
              </div>
            )}
            <button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))
                    .then(() => window.location.reload());
                } else {
                  window.location.reload();
                }
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
