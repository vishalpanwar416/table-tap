import React from 'react';
import * as Sentry from '@sentry/react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error) {
    if (error.message && error.message.includes('Extension context invalidated')) {
      return { hasError: false };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const eventId = Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
      extra: { boundary: this.props.name || 'root' },
    });
    this.setState({ eventId });
  }

  handleReset() {
    this.setState({ hasError: false, error: null, eventId: null });
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, inline } = this.props;

      if (Fallback) {
        return <Fallback error={this.state.error} reset={this.handleReset} />;
      }

      if (inline) {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-500 mb-3">This section failed to load.</p>
            <button
              onClick={this.handleReset}
              className="text-sm text-primary-500 underline hover:text-primary-600"
            >
              Try again
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="text-center text-white max-w-sm">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-6">Please refresh the page and try again.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-primary-500 text-white px-5 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Refresh Page
              </button>
              {this.state.eventId && (
                <button
                  onClick={() => Sentry.showReportDialog({ eventId: this.state.eventId })}
                  className="border border-white/20 text-gray-300 px-5 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
                >
                  Report Issue
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
