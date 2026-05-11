import { MouseEvent } from "react";
import { Eye, FileDiff, Pin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelection, type SelectionTab } from "../state/selection.js";

export function FileTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab, pinTab } = useSelection();

  if (tabs.length === 0) return null;

  return (
    <div className="hairline-b flex min-h-10 items-stretch overflow-x-auto overflow-y-hidden bg-muted/20">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          active={tab.id === activeTabId}
          onActivate={() => setActiveTab(tab.id)}
          onPin={() => pinTab(tab.id)}
          onClose={() => closeTab(tab.id)}
        />
      ))}
    </div>
  );
}

function TabButton({
  tab,
  active,
  onActivate,
  onPin,
  onClose,
}: {
  tab: SelectionTab;
  active: boolean;
  onActivate: () => void;
  onPin: () => void;
  onClose: () => void;
}) {
  const Icon = tab.kind === "view" ? Eye : FileDiff;

  return (
    <div
      role="button"
      tabIndex={0}
      title={tab.path}
      onClick={onActivate}
      onDoubleClick={onPin}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
      className={cn(
        "group flex min-w-0 max-w-72 shrink-0 items-center gap-2 border-r border-border/70 px-3 text-left text-sm transition-colors",
        active ? "bg-background text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0 opacity-70" />
      <span className="truncate">{labelForPath(tab.path)}</span>
      {!tab.pinned && (
        <span className="text-[10px] uppercase tracking-wider opacity-60">
          Preview
        </span>
      )}
      {tab.pinned && <Pin className="size-3 shrink-0 opacity-50" />}
      <button
        type="button"
        aria-label={`Close ${tab.path}`}
        className="ml-auto shrink-0 rounded-sm p-0.5 opacity-0 transition-opacity hover:bg-accent/60 group-hover:opacity-100 group-focus-within:opacity-100"
        onClick={(event) => handleClose(event, onClose)}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function handleClose(event: MouseEvent<HTMLButtonElement>, onClose: () => void) {
  event.stopPropagation();
  onClose();
}

function labelForPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}
