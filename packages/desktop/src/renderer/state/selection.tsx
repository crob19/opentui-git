import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type FileTreeMode = "unstaged" | "staged" | "branch";

type SelectionState = {
  mode: FileTreeMode;
  setMode: (mode: FileTreeMode) => void;
  selected: string | null;
  setSelected: (path: string | null) => void;
};

const SelectionContext = createContext<SelectionState | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [mode, setModeRaw] = useState<FileTreeMode>("unstaged");
  const [selected, setSelected] = useState<string | null>(null);

  const value = useMemo<SelectionState>(
    () => ({
      mode,
      setMode: (next) => {
        setModeRaw(next);
        setSelected(null);
      },
      selected,
      setSelected,
    }),
    [mode, selected],
  );

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection(): SelectionState {
  const ctx = useContext(SelectionContext);
  if (!ctx)
    throw new Error("useSelection must be used within SelectionProvider");
  return ctx;
}
