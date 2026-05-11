import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ApolloClient } from "@apollo/client/index.js";
import { createClient } from "@opentui-git/client";

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

  const closeProject = useCallback(
    (id: string) => {
      setProjects((current) => {
        const next = current.filter((p) => p.id !== id);
        const closed = current.find((p) => p.id === id);
        if (closed) {
          try {
            closed.client.stop();
          } catch {
            /* ignore */
          }
        }
        void window.opentui?.projects.close(id);
        return next;
      });
      setActiveId((current) => {
        if (current !== id) return current;
        const idx = projects.findIndex((p) => p.id === id);
        const remaining = projects.filter((p) => p.id !== id);
        return (
          (remaining[idx] ?? remaining[idx - 1] ?? remaining[0])?.id ?? null
        );
      });
    },
    [projects],
  );

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
