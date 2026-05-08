import { useEffect, useRef } from "react";

export type ContextMenuItem = {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

type Props = {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
};

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <ul ref={ref} style={{ ...styles.menu, top: y, left: x }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            ...styles.item,
            ...(item.destructive ? styles.destructive : {}),
            ...(item.disabled ? styles.disabled : {}),
          }}
          onClick={() => {
            if (item.disabled) return;
            item.onSelect();
            onClose();
          }}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}

const styles: Record<string, React.CSSProperties> = {
  menu: {
    position: "fixed",
    listStyle: "none",
    margin: 0,
    padding: 4,
    background: "#1c1c1c",
    border: "1px solid #2a2a2a",
    borderRadius: 6,
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    minWidth: 180,
    zIndex: 800,
    fontSize: 13,
  },
  item: {
    padding: "6px 10px",
    borderRadius: 4,
    color: "#e6e6e6",
    cursor: "pointer",
    userSelect: "none",
  },
  destructive: { color: "#ff8a80" },
  disabled: { color: "#555", cursor: "not-allowed" },
};
