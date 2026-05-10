import { ReactNode, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { FileTree } from "./FileTree.js";
import { BranchList } from "./BranchList.js";
import { TagList } from "./TagList.js";
import { CommitPanel } from "./CommitPanel.js";
import type { GitFileStatus } from "opentui-git/git/types";

type Props = {
  files: GitFileStatus[];
  stagedCount: number;
  stagedPaths: string[];
};

export function RepositorySidebar({ files, stagedCount, stagedPaths }: Props) {
  const [branchRefreshSignal, setBranchRefreshSignal] = useState(0);
  const [tagRefreshSignal, setTagRefreshSignal] = useState(0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarSection title="Changes" defaultOpen className="flex-[2_1_260px]">
        <FileTree files={files} />
      </SidebarSection>
      <SidebarSection
        title="Branches"
        defaultOpen
        className="min-h-[180px]"
        onOpen={() => setBranchRefreshSignal((value) => value + 1)}
      >
        <BranchList refreshSignal={branchRefreshSignal} />
      </SidebarSection>
      <SidebarSection
        title="Tags"
        defaultOpen={false}
        className="min-h-[120px]"
        onOpen={() => setTagRefreshSignal((value) => value + 1)}
      >
        <TagList refreshSignal={tagRefreshSignal} />
      </SidebarSection>
      <SidebarSection title="Commit" defaultOpen className="min-h-[220px]">
        <CommitPanel stagedCount={stagedCount} stagedPaths={stagedPaths} />
      </SidebarSection>
    </div>
  );
}

function SidebarSection({
  title,
  defaultOpen,
  className,
  onOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  onOpen?: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) onOpen?.();
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className={`flex min-h-0 flex-col border-b border-border ${open ? className ?? "flex-1" : "shrink-0"}`}
    >
      <CollapsibleTrigger className="flex h-8 shrink-0 items-center gap-1.5 px-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:bg-accent/40">
        {open ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        <span>{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="min-h-0 flex-1 overflow-hidden">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
