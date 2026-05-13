import { useEffect, useRef } from "react";

// pierre/trees has no double-click hook. Rows render `data-item-path` and
// `data-item-type` on the DOM, so we attach a dblclick listener at the
// container and walk up to the nearest row to recover the path.
export function usePinOnDoubleClick(onPin: (path: string) => void) {
  const onPinRef = useRef(onPin);
  onPinRef.current = onPin;

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const row = target?.closest<HTMLElement>("[data-item-path]");
      if (!row) return;
      if (row.dataset.itemType !== "file") return;
      const path = row.dataset.itemPath;
      if (!path) return;
      onPinRef.current(path);
    };
    el.addEventListener("dblclick", handler);
    return () => el.removeEventListener("dblclick", handler);
  }, []);

  return ref;
}
