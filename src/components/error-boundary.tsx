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
 */
function DefaultFallback(props: { error: Error; reset: () => void }): JSXElement {
  return (
    <box
      width="100%"
      height="100%"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={1}
    >
      <text fg="#FF4444">Application Error</text>
      <text fg="#FFFFFF">{props.error.message}</text>
      <text fg="#888888">
        {props.error.stack?.split('\n')[1] || 'No stack trace available'}
      </text>
      <text fg="#00AAFF">Please restart the application</text>
    </box>
  );
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
