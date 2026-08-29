import React from 'react';

/**
 * ErrorBoundary Component
 * Catches any JavaScript errors in child component tree and displays a clean fallback UI
 * instead of crashing the whole application to a blank white screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error in admin component:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-white rounded-3xl border border-rose-100 shadow-sm text-center max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-4 border border-rose-100">
            ⚠️
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Module Loading Glitch</h3>
          <p className="text-xs text-slate-500 mb-4">
            {this.state.error?.message || 'A temporary error occurred while rendering this section.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
              else window.location.reload();
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            Reload Module
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
