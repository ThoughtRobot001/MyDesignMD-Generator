import React from "react";

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /** Initializes the error boundary state. */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** Updates state when a child render error is caught. */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /** Reloads the current page to retry the failed render path. */
  private handleRetry(): void {
    window.location.reload();
  }

  /** Renders either children or the configured error fallback. */
  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-950">
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="mt-2 text-sm">{this.state.error?.message ?? "An unexpected render error occurred."}</p>
        <button
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          type="button"
          onClick={this.handleRetry}
        >
          Try again
        </button>
      </div>
    );
  }
}
