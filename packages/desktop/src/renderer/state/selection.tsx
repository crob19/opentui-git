import { createContext, useContext, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

export type FileTreeMode = "unstaged" | "staged" | "branch";
export type SelectionKind = "diff" | "view" | "terminal";
export type FileSelectionTab = {
  id: string;
  path: string;
  kind: "diff" | "view";
  mode: FileTreeMode;
  compareBranch: string | null;
  pinned: boolean;
};
export type TerminalSelectionTab = {
  id: string;
  kind: "terminal";
  title: string;
  pinned: boolean;
};
export type SelectionTab = FileSelectionTab | TerminalSelectionTab;

type OpenTabOptions = {
  path: string;
  kind?: "diff" | "view";
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
  openTerminalTab: () => void;
  closeTab: (id: string) => void;
  pinTab: (id: string) => void;
  invalidateDiffTabs: () => void;
  selected: string | null;
  kind: SelectionKind;
  setSelected: (path: string | null, kind?: "diff" | "view", pinned?: boolean) => void;
  resetSelection: () => void;
};

const SelectionContext = createContext<SelectionState | null>(null);

export function isFileTab(tab: SelectionTab | null): tab is FileSelectionTab {
  return Boolean(tab && tab.kind !== "terminal");
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
    setTabs((prev) => {
      const existing = prev.find(
        (tab): tab is FileSelectionTab =>
          isFileTab(tab) &&
          tab.path === path &&
          tab.kind === kind &&
          tab.mode === tabMode &&
          tab.compareBranch === compareBranch,
      );
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

  const openTerminalTab = () => {
    setTabs((prev) => {
      const existing = prev.find((tab) => tab.kind === "terminal");
      if (existing) {
        setActiveTabId(existing.id);
        return prev;
      }

      const newTab: TerminalSelectionTab = {
        id: `tab-${nextTabId.current++}`,
        kind: "terminal",
        title: "Terminal",
        pinned: true,
      };
      setActiveTabId(newTab.id);
      return [...prev, newTab];
    });
  };

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? null;

  const value = useMemo<SelectionState>(
    () => ({
      mode,
      setMode: (next) => {
        setModeRaw(next);
        invalidateDiffTabs();
      },
      tabs,
      activeTab,
      activeTabId,
      setActiveTab: (id) => setActiveTabId(id),
      openTab,
      openTerminalTab,
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
      selected: isFileTab(activeTab) ? activeTab.path : null,
      kind: activeTab?.kind ?? "diff",
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
    [activeTab, activeTabId, mode, tabs],
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
