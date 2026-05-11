import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export type FileTreeMode = "unstaged" | "staged" | "branch";
export type SelectionKind = "diff" | "view";
export type SelectionTab = {
  id: string;
  path: string;
  kind: SelectionKind;
  mode: FileTreeMode;
  compareBranch: string | null;
  pinned: boolean;
};

type OpenTabOptions = {
  path: string;
  kind?: SelectionKind;
  mode?: FileTreeMode;
  compareBranch?: string | null;
  pinned?: boolean;
};

type SelectionState = {
  mode: FileTreeMode;
  setMode: (mode: FileTreeMode) => void;
  tabs: SelectionTab[];
  activeTab: SelectionTab | null;
  activeTabId: string | null;
  setActiveTab: (id: string) => void;
  openTab: (options: OpenTabOptions) => void;
  closeTab: (id: string) => void;
  pinTab: (id: string) => void;
  invalidateDiffTabs: () => void;
  selected: string | null;
  kind: SelectionKind;
  setSelected: (path: string | null, kind?: SelectionKind, pinned?: boolean) => void;
  resetSelection: () => void;
};

const SelectionContext = createContext<SelectionState | null>(null);

function makeTabKey(options: {
  path: string;
  kind: SelectionKind;
  mode: FileTreeMode;
  compareBranch: string | null;
}): string {
  return [
    options.kind,
    options.mode,
    options.compareBranch ?? "",
    options.path,
  ].join("::");
}

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [mode, setModeRaw] = useState<FileTreeMode>("unstaged");
  const [tabs, setTabs] = useState<SelectionTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const nextTabId = useRef(0);

  const invalidateDiffTabs = () => {
    setTabs((prev) => {
      const next = prev.filter((tab) => tab.kind !== "diff");
      if (activeTabId && !next.some((tab) => tab.id === activeTabId)) {
        setActiveTabId(next.at(-1)?.id ?? null);
      }
      return next;
    });
  };

  const openTab = ({
    path,
    kind = "diff",
    mode: tabMode = mode,
    compareBranch = null,
    pinned = false,
  }: OpenTabOptions) => {
    const key = makeTabKey({ path, kind, mode: tabMode, compareBranch });

    setTabs((prev) => {
      const existing = prev.find((tab) => makeTabKey(tab) === key);
      if (existing) {
        setActiveTabId(existing.id);
        if (pinned && !existing.pinned) {
          return prev.map((tab) =>
            tab.id === existing.id ? { ...tab, pinned: true } : tab,
          );
        }
        return prev;
      }

      const newTab: SelectionTab = {
        id: `tab-${nextTabId.current++}`,
        path,
        kind,
        mode: tabMode,
        compareBranch,
        pinned,
      };

      if (pinned) {
        setActiveTabId(newTab.id);
        return [...prev, newTab];
      }

      const previewIndex = prev.findIndex((tab) => !tab.pinned);
      if (previewIndex === -1) {
        setActiveTabId(newTab.id);
        return [...prev, newTab];
      }

      const next = [...prev];
      next[previewIndex] = { ...newTab, id: prev[previewIndex].id };
      setActiveTabId(next[previewIndex].id);
      return next;
    });
  };

  const value = useMemo<SelectionState>(
    () => ({
      mode,
      setMode: (next) => {
        setModeRaw(next);
        invalidateDiffTabs();
      },
      tabs,
      activeTab: tabs.find((tab) => tab.id === activeTabId) ?? null,
      activeTabId,
      setActiveTab: (id) => setActiveTabId(id),
      openTab,
      closeTab: (id) => {
        setTabs((prev) => {
          const index = prev.findIndex((tab) => tab.id === id);
          if (index === -1) return prev;
          const next = prev.filter((tab) => tab.id !== id);
          if (activeTabId === id) {
            const fallback = next[index] ?? next[index - 1] ?? null;
            setActiveTabId(fallback?.id ?? null);
          }
          return next;
        });
      },
      pinTab: (id) =>
        setTabs((prev) =>
          prev.map((tab) => (tab.id === id ? { ...tab, pinned: true } : tab)),
        ),
      invalidateDiffTabs,
      selected: tabs.find((tab) => tab.id === activeTabId)?.path ?? null,
      kind: tabs.find((tab) => tab.id === activeTabId)?.kind ?? "diff",
      setSelected: (path, nextKind = "diff", pinned = false) => {
        if (!path) {
          setActiveTabId(null);
          return;
        }
        openTab({ path, kind: nextKind, pinned });
      },
      resetSelection: () => {
        setTabs([]);
        setActiveTabId(null);
      },
    }),
    [activeTabId, mode, tabs],
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
