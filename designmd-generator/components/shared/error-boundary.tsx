import type { ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renders a placeholder for the application error boundary. */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps): JSX.Element {
  return <>{fallback ?? children}</>;
}
