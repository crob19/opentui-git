import type { ToastContext } from "../components/toast.js";

/**
 * Options for error handling
 */
export interface ErrorHandlerOptions {
  /** Toast context for displaying user-facing messages */
  toast: ToastContext;
  /** Optional function to set error message in component state */
  setErrorMessage?: (msg: string) => void;
  /** Name of the operation being performed (e.g., "commit", "push") */
  operation: string;
}

/**
 * Handles async operations with standardized error handling and toast notifications
 * @param operation - Async function to execute
 * @param options - Error handler options
 * @returns Result of the operation or null if it failed
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions,
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    const errorMessage = formatError(error);
    console.error(`${options.operation} failed:`, error);
    options.toast.error(errorMessage);
    if (options.setErrorMessage) {
      options.setErrorMessage(errorMessage);
    }
    return null;
  }
}

/**
 * Formats an error into a user-friendly string message
 * @param error - Error object (can be Error, string, or unknown)
 * @returns Formatted error message string
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Unknown error occurred";
}
