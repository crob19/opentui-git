import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

type ToastKind = "info" | "success" | "error";
type Toast = { id: number; kind: ToastKind; message: string };

type ToastApi = {
  info: (msg: string) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      kind === "error" ? 6000 : 3000,
    );
  }, []);

  const api: ToastApi = {
    info: (m) => push("info", m),
    success: (m) => push("success", m),
    error: (m) => push("error", m),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div style={styles.stack}>
        {toasts.map((t) => (
          <div key={t.id} style={{ ...styles.toast, ...kindStyles[t.kind] }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

const styles: Record<string, React.CSSProperties> = {
  stack: {
    position: "fixed",
    bottom: 16,
    right: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    zIndex: 1000,
    pointerEvents: "none",
  },
  toast: {
    padding: "10px 14px",
    borderRadius: 6,
    fontSize: 13,
    color: "#fff",
    boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
    minWidth: 240,
    maxWidth: 480,
  },
};

const kindStyles: Record<ToastKind, React.CSSProperties> = {
  info: { background: "#2d6cdf" },
  success: { background: "#1f8b4c" },
  error: { background: "#c0392b" },
};
