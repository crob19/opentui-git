import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ApolloClient } from "@apollo/client/index.js";
import { createClient } from "@opentui-git/client";
import { disposeTerminal } from "../lib/terminalSession.js";

export type ProjectClient = {
  id: string;
  path: string;
  name: string;
  endpoint: string;
  client: ApolloClient<unknown>;
};

type ProjectsState = {
  projects: ProjectClient[];
  activeId: string | null;
  activate: (id: string) => void;
  openFromPicker: () => Promise<void>;
  closeProject: (id: string) => void;
};

const ProjectsContext = createContext<ProjectsState | null>(null);

function build(info: ProjectInfo): ProjectClient {
  return {
    id: info.id,
    path: info.path,
    name: info.name,
    endpoint: info.endpoint,
    client: createClient({
      endpoint: info.endpoint,
      fetch: window.fetch.bind(window),
    }),
  };
}

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const initial = useMemo(
    () => (window.opentui?.projects.initial ?? []).map(build),
    [],
  );
  const [projects, setProjects] = useState<ProjectClient[]>(initial);
  const [activeId, setActiveId] = useState<string | null>(
    initial[0]?.id ?? null,
  );
  // Ref so closeProject can read latest projects without re-binding the callback
  // and without putting side effects in a setState updater (StrictMode safety).
  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const activate = useCallback((id: string) => setActiveId(id), []);

  const openFromPicker = useCallback(async () => {
    const bridge = window.opentui?.projects;
    if (!bridge) return;
    const picked = await bridge.pickDirectory();
    if (!picked) return;
    const result = await bridge.open(picked);
    if (!result.ok) {
      console.error("Failed to open project:", result.error);
      return;
    }
    setProjects((current) => {
      const existing = current.find((p) => p.id === result.project.id);
      if (existing) return current;
      return [...current, build(result.project)];
    });
    setActiveId(result.project.id);
  }, []);

  const closeProject = useCallback((id: string) => {
    const current = projectsRef.current;
    const idx = current.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const closed = current[idx]!;
    const next = current.filter((p) => p.id !== id);
    const nextActive = (next[idx] ?? next[idx - 1] ?? next[0])?.id ?? null;

    try {
      closed.client.stop();
    } catch {
      /* ignore */
    }
    disposeTerminal(closed.id);
    void window.opentui?.projects.close(id);

    setProjects(next);
    setActiveId((cur) => (cur === id ? nextActive : cur));
  }, []);

  const value = useMemo<ProjectsState>(
    () => ({ projects, activeId, activate, openFromPicker, closeProject }),
    [projects, activeId, activate, openFromPicker, closeProject],
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects(): ProjectsState {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
