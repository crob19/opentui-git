import { createContext, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";

export type FileTreeMode = "unstaged" | "staged" | "branch";
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
};

const SelectionContext = createContext<SelectionState | null>(null);

export function isFileTab(tab: SelectionTab | null): tab is FileSelectionTab {
  return Boolean(tab && tab.kind !== "terminal");
}

type ReducerState = {
  mode: FileTreeMode;
  tabs: SelectionTab[];
  activeTabId: string | null;
  nextId: number;
};

type Action =
  | { type: "SET_MODE"; mode: FileTreeMode }
  | { type: "SET_ACTIVE"; id: string }
  | {
      type: "OPEN_TAB";
      path: string;
      kind: "diff" | "view";
      mode: FileTreeMode;
      compareBranch: string | null;
      pinned: boolean;
    }
  | { type: "OPEN_TERMINAL" }
  | { type: "CLOSE_TAB"; id: string }
  | { type: "PIN_TAB"; id: string }
  | { type: "INVALIDATE_DIFF_TABS" };

function dropTabs(
  state: ReducerState,
  predicate: (tab: SelectionTab) => boolean,
): ReducerState {
  const tabs = state.tabs.filter((t) => !predicate(t));
  if (tabs.length === state.tabs.length) return state;
  const activeTabId = tabs.some((t) => t.id === state.activeTabId)
    ? state.activeTabId
    : (tabs.at(-1)?.id ?? null);
  return { ...state, tabs, activeTabId };
}

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case "SET_MODE":
      return dropTabs(
        { ...state, mode: action.mode },
        (t) => t.kind === "diff",
      );
    case "SET_ACTIVE":
      return state.activeTabId === action.id
        ? state
        : { ...state, activeTabId: action.id };
    case "OPEN_TAB": {
      const { path, kind, mode, compareBranch, pinned } = action;
      const existing = state.tabs.find(
        (t): t is FileSelectionTab =>
          isFileTab(t) &&
          t.path === path &&
          t.kind === kind &&
          t.mode === mode &&
          t.compareBranch === compareBranch,
      );
      if (existing) {
        const tabs =
          pinned && !existing.pinned
            ? state.tabs.map((t) =>
                t.id === existing.id ? { ...t, pinned: true } : t,
              )
            : state.tabs;
        return { ...state, tabs, activeTabId: existing.id };
      }
      const id = `tab-${state.nextId}`;
      const newTab: FileSelectionTab = {
        id,
        path,
        kind,
        mode,
        compareBranch,
        pinned,
      };
      if (pinned) {
        return {
          ...state,
          tabs: [...state.tabs, newTab],
          activeTabId: id,
          nextId: state.nextId + 1,
        };
      }
      const previewIndex = state.tabs.findIndex((t) => !t.pinned);
      if (previewIndex === -1) {
        return {
          ...state,
          tabs: [...state.tabs, newTab],
          activeTabId: id,
          nextId: state.nextId + 1,
        };
      }
      const tabs = [...state.tabs];
      const replacedId = state.tabs[previewIndex].id;
      tabs[previewIndex] = { ...newTab, id: replacedId };
      return { ...state, tabs, activeTabId: replacedId };
    }
    case "OPEN_TERMINAL": {
      const existing = state.tabs.find((t) => t.kind === "terminal");
      if (existing) return { ...state, activeTabId: existing.id };
      const id = `tab-${state.nextId}`;
      const newTab: TerminalSelectionTab = {
        id,
        kind: "terminal",
        title: "Terminal",
        pinned: true,
      };
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: id,
        nextId: state.nextId + 1,
      };
    }
    case "CLOSE_TAB": {
      const index = state.tabs.findIndex((t) => t.id === action.id);
      if (index === -1) return state;
      const tabs = state.tabs.filter((t) => t.id !== action.id);
      let activeTabId = state.activeTabId;
      if (state.activeTabId === action.id) {
        activeTabId = (tabs[index] ?? tabs[index - 1] ?? null)?.id ?? null;
      }
      return { ...state, tabs, activeTabId };
    }
    case "PIN_TAB":
      return {
        ...state,
        tabs: state.tabs.map((t) =>
          t.id === action.id ? { ...t, pinned: true } : t,
        ),
      };
    case "INVALIDATE_DIFF_TABS":
      return dropTabs(state, (t) => t.kind === "diff");
  }
}

const INITIAL: ReducerState = {
  mode: "unstaged",
  tabs: [],
  activeTabId: null,
  nextId: 0,
};

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const value = useMemo<SelectionState>(() => {
    const activeTab =
      state.tabs.find((t) => t.id === state.activeTabId) ?? null;
    return {
      mode: state.mode,
      setMode: (mode) => dispatch({ type: "SET_MODE", mode }),
      tabs: state.tabs,
      activeTab,
      activeTabId: state.activeTabId,
      setActiveTab: (id) => dispatch({ type: "SET_ACTIVE", id }),
      openTab: ({
        path,
        kind = "diff",
        mode = state.mode,
        compareBranch = null,
        pinned = false,
      }) =>
        dispatch({
          type: "OPEN_TAB",
          path,
          kind,
          mode,
          compareBranch,
          pinned,
        }),
      openTerminalTab: () => dispatch({ type: "OPEN_TERMINAL" }),
      closeTab: (id) => dispatch({ type: "CLOSE_TAB", id }),
      pinTab: (id) => dispatch({ type: "PIN_TAB", id }),
      invalidateDiffTabs: () => dispatch({ type: "INVALIDATE_DIFF_TABS" }),
    };
  }, [state]);

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
