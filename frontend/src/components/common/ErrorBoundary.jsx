import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary Caught Error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[450px] w-full flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#0B254B]/90 backdrop-blur-xl border border-white/15 rounded-3xl p-8 shadow-2xl text-center text-white space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {this.props.title || 'Screen Rendering Interrupted'}
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                {this.props.message ||
                  'An unexpected rendering issue occurred in this section. Your data is safe and the rest of the workspace remains accessible.'}
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-black/40 rounded-xl border border-white/10 text-left">
                <p className="text-[11px] font-mono text-rose-300 break-words line-clamp-3">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:brightness-110 text-white text-xs font-extrabold flex items-center space-x-1.5 shadow-lg shadow-blue-500/30 transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = '/admin/appointments';
                }}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Appointments Roster</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
