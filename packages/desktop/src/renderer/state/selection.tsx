import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type FileTreeMode = "unstaged" | "staged" | "branch";
export type SelectionKind = "diff" | "view";

type SelectionState = {
  mode: FileTreeMode;
  setMode: (mode: FileTreeMode) => void;
  selected: string | null;
  kind: SelectionKind;
  setSelected: (path: string | null, kind?: SelectionKind) => void;
  resetSelection: () => void;
};

const SelectionContext = createContext<SelectionState | null>(null);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [mode, setModeRaw] = useState<FileTreeMode>("unstaged");
  const [selected, setSelectedRaw] = useState<string | null>(null);
  const [kind, setKind] = useState<SelectionKind>("diff");

  const value = useMemo<SelectionState>(
    () => ({
      mode,
      setMode: (next) => {
        setModeRaw(next);
        setSelectedRaw(null);
        setKind("diff");
      },
      selected,
      kind,
      setSelected: (path, nextKind = "diff") => {
        setSelectedRaw(path);
        setKind(nextKind);
      },
      resetSelection: () => {
        setSelectedRaw(null);
        setKind("diff");
      },
    }),
    [mode, selected, kind],
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
