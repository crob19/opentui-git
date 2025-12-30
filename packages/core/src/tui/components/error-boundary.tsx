import { ErrorBoundary as SolidErrorBoundary, type JSXElement } from "solid-js";

/**
 * Props for the ErrorBoundary component
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: JSXElement;
  /** Optional custom fallback to show on error */
  fallback?: (error: Error, reset: () => void) => JSXElement;
}

/**
 * Default fallback UI shown when an error occurs
 * Note: Cannot use OpenTUI elements here as they require renderer context
 * which may not be available when this fallback is triggered
 */
function DefaultFallback(props: { error: Error; reset: () => void }): JSXElement {
  // Log error to console since we can't render a UI for it
  console.error("=".repeat(80));
  console.error("APPLICATION ERROR:");
  console.error(props.error.message);
  console.error(props.error.stack);
  console.error("=".repeat(80));
  console.error("Please restart the application (press 'q' to quit)");
  
  // Return null since we can't safely render UI elements here
  return null as any;
}

/**
 * Error boundary component that catches and displays errors gracefully
 * Prevents the entire application from crashing when errors occur
 * @param props - ErrorBoundary properties
 * @returns Error boundary wrapper component
 */
export function ErrorBoundary(props: ErrorBoundaryProps): JSXElement {
  return (
    <SolidErrorBoundary
      fallback={(error: Error, reset: () => void) => {
        console.error("Error boundary caught error:", error);
        
        if (props.fallback) {
          return props.fallback(error, reset);
        }
        
        return <DefaultFallback error={error} reset={reset} />;
      }}
    >
      {props.children}
    </SolidErrorBoundary>
  );
}
