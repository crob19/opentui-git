import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

type ModalRequest = {
  id: number;
  close: (result: unknown) => void;
  render: (close: (result: unknown) => void) => ReactNode;
};

type ModalApi = {
  open: <T>(render: (close: (result: T) => void) => ReactNode) => Promise<T>;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

type ConfirmOptions = {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

const ModalCtx = createContext<ModalApi | null>(null);

export function useModal(): ModalApi {
  const ctx = useContext(ModalCtx);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<ModalRequest[]>([]);
  const idRef = useRef(0);

  const open = useCallback<ModalApi["open"]>((render) => {
    return new Promise((resolve) => {
      const id = ++idRef.current;
      const close = (result: unknown) => {
        setStack((s) => s.filter((m) => m.id !== id));
        resolve(result as never);
      };
      setStack((s) => [
        ...s,
        { id, close, render: (cb) => render(cb as (r: unknown) => void) },
      ]);
    });
  }, []);

  const confirm = useCallback<ModalApi["confirm"]>(
    (opts) =>
      open<boolean>((close) => <ConfirmDialog opts={opts} onClose={close} />),
    [open],
  );

  const top = stack[stack.length - 1];

  useEffect(() => {
    if (!top) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        top.close(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [top]);

  return (
    <ModalCtx.Provider value={{ open, confirm }}>
      {children}
      {stack.map((m) => (
        <div key={m.id} style={styles.overlay}>
          <div style={styles.dialog}>{m.render(m.close)}</div>
        </div>
      ))}
    </ModalCtx.Provider>
  );
}

function ConfirmDialog({
  opts,
  onClose,
}: {
  opts: ConfirmOptions;
  onClose: (result: boolean) => void;
}) {
  return (
    <div style={styles.confirmWrap}>
      <h3 style={styles.title}>{opts.title}</h3>
      <div style={styles.message}>{opts.message}</div>
      <div style={styles.actions}>
        <button style={styles.cancelBtn} onClick={() => onClose(false)}>
          {opts.cancelLabel ?? "Cancel"}
        </button>
        <button
          style={opts.destructive ? styles.destructiveBtn : styles.confirmBtn}
          onClick={() => onClose(true)}
          autoFocus
        >
          {opts.confirmLabel ?? "Confirm"}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 900,
  },
  dialog: {
    background: "#1c1c1c",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    minWidth: 380,
    maxWidth: 560,
    color: "#e6e6e6",
  },
  confirmWrap: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  title: { margin: 0, fontSize: 15, fontWeight: 600 },
  message: { fontSize: 13, color: "#bbb", lineHeight: 1.5 },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid #3a3a3a",
    color: "#ccc",
    padding: "6px 14px",
    borderRadius: 4,
    fontSize: 13,
    cursor: "pointer",
  },
  confirmBtn: {
    background: "#2d6cdf",
    border: "none",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: 4,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
  },
  destructiveBtn: {
    background: "#c0392b",
    border: "none",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: 4,
    fontSize: 13,
    cursor: "pointer",
    fontWeight: 500,
  },
};
