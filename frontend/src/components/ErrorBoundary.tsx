import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-theme-card rounded-3xl border border-rose-500/20 shadow-xl m-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-lg font-black text-theme-text mb-1">
            {this.props.fallbackTitle || 'Something went wrong on this page'}
          </h2>
          <p className="text-xs text-theme-text-muted max-w-md mb-4">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-primary hover:bg-theme-primary-hover text-xs font-bold text-white shadow-md transition-all"
            >
              <RefreshCw size={14} /> Reload Page
            </button>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <pre className="mt-6 p-4 rounded-xl bg-theme-bg-alt border border-theme-border text-left text-[11px] text-rose-400 max-w-2xl overflow-auto w-full font-mono">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
