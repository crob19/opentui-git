import { createSignal } from "solid-js";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

let toastIdCounter = 0;

const [toasts, setToasts] = createSignal<ToastMessage[]>([]);

// Map to store timeout IDs for cleanup
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Show a toast notification
 */
export function showToast(message: string, type: "success" | "error" | "info" = "info", duration = 3000) {
  const id = `toast-${++toastIdCounter}`;
  const toast: ToastMessage = { id, message, type, duration };
  
  setToasts((prev) => [...prev, toast]);
  
  if (duration > 0) {
    const timeoutId = setTimeout(() => {
      removeToast(id);
    }, duration);
    toastTimeouts.set(id, timeoutId);
  }
  
  return id;
}

/**
 * Remove a toast by id
 */
export function removeToast(id: string) {
  // Clear the timeout if it exists
  const timeoutId = toastTimeouts.get(id);
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    toastTimeouts.delete(id);
  }
  
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

/**
 * Toast container component - should be rendered once in the app
 */
export function ToastContainer() {
  return (
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts().map((toast) => (
        <Toast toast={toast} />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: ToastMessage;
}

function Toast(props: ToastProps) {
  const bgColor = () => {
    switch (props.toast.type) {
      case "success":
        return "bg-green-900/90 text-green-100 border-green-700";
      case "error":
        return "bg-red-900/90 text-red-100 border-red-700";
      case "info":
        return "bg-blue-900/90 text-blue-100 border-blue-700";
    }
  };

  const icon = () => {
    switch (props.toast.type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "info":
        return "ℹ";
    }
  };

  return (
    <div
      class={`
        ${bgColor()}
        px-4 py-3 rounded-lg shadow-lg border
        flex items-center gap-3 min-w-[300px] max-w-[500px]
        animate-in slide-in-from-right fade-in duration-200
        pointer-events-auto
      `}
    >
      <span class="text-lg font-bold">{icon()}</span>
      <span class="flex-1 text-sm">{props.toast.message}</span>
      <button
        onClick={() => removeToast(props.toast.id)}
        class="text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
