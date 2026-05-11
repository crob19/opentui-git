import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjects } from "../state/projects.js";

export function ProjectTabBar() {
  const { projects, activeId, activate, openFromPicker, closeProject } =
    useProjects();

  return (
    <div
      className="flex shrink-0 items-stretch gap-px overflow-x-auto hairline-b"
      style={{ background: "var(--window)" }}
    >
      {projects.map((p) => {
        const active = p.id === activeId;
        return (
          <div
            key={p.id}
            className={cn(
              "group flex max-w-[220px] items-center gap-1.5 pl-3 pr-1 py-1.5 text-xs cursor-pointer select-none",
              active
                ? "bg-[var(--code)] text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
            )}
            onClick={() => activate(p.id)}
            title={p.path}
          >
            <span className="truncate">{p.name}</span>
            {projects.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeProject(p.id);
                }}
                className="rounded p-0.5 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
                aria-label={`Close ${p.name}`}
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => void openFromPicker()}
        className="flex items-center justify-center px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/30"
        aria-label="Open project"
        title="Open project…"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
