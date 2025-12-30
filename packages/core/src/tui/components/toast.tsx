import {
  createContext,
  useContext,
  For,
  type ParentProps,
} from "solid-js";
import { createStore, produce } from "solid-js/store";

/**
 * Toast notification system - displays temporary messages
 */

export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  nextId: number;
}

function createToastContext() {
  const [state, setState] = createStore<ToastState>({
    toasts: [],
    nextId: 1,
  });

  const show = (message: string, type: ToastType = "info", duration: number = 3000) => {
    const id = state.nextId;
    
    setState(
      produce((s) => {
        s.toasts.push({ id, message, type });
        s.nextId++;
      })
    );

    // Auto-remove after duration
    setTimeout(() => {
      setState(
        produce((s) => {
          const index = s.toasts.findIndex((t) => t.id === id);
          if (index !== -1) {
            s.toasts.splice(index, 1);
          }
        })
      );
    }, duration);

    return id;
  };

  const dismiss = (id: number) => {
    setState(
      produce((s) => {
        const index = s.toasts.findIndex((t) => t.id === id);
        if (index !== -1) {
          s.toasts.splice(index, 1);
        }
      })
    );
  };

  return {
    get toasts() {
      return state.toasts;
    },
    show,
    success: (message: string, duration?: number) => show(message, "success", duration),
    error: (message: string, duration?: number) => show(message, "error", duration ?? 5000),
    info: (message: string, duration?: number) => show(message, "info", duration),
    warning: (message: string, duration?: number) => show(message, "warning", duration ?? 4000),
    dismiss,
  };
}

export type ToastContext = ReturnType<typeof createToastContext>;

const ToastCtx = createContext<ToastContext>();

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

function getToastColors(type: ToastType): { bg: string; fg: string; icon: string } {
  switch (type) {
    case "success":
      return { bg: "#1a3d1a", fg: "#44FF44", icon: "✓" };
    case "error":
      return { bg: "#3d1a1a", fg: "#FF4444", icon: "✗" };
    case "warning":
      return { bg: "#3d3d1a", fg: "#FFAA00", icon: "!" };
    case "info":
    default:
      return { bg: "#1a1a3d", fg: "#00AAFF", icon: "i" };
  }
}

export function ToastProvider(props: ParentProps) {
  const toast = createToastContext();

  return (
    <ToastCtx.Provider value={toast}>
      {props.children}
      {/* Toast container - positioned at bottom right */}
      <box
        position="absolute"
        right={2}
        bottom={4}
        width={50}
        flexDirection="column"
        gap={1}
      >
        <For each={toast.toasts}>
          {(t) => {
            const colors = getToastColors(t.type);
            return (
              <box
                backgroundColor={colors.bg}
                borderStyle="single"
                borderColor={colors.fg}
                paddingLeft={1}
                paddingRight={1}
                flexDirection="row"
                gap={1}
              >
                <text fg={colors.fg}>{colors.icon}</text>
                <text fg={colors.fg}>{t.message}</text>
              </box>
            );
          }}
        </For>
      </box>
    </ToastCtx.Provider>
  );
}
