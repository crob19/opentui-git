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
import type { GitFileStatus } from "opentui-git/git/types";

type Props = {
  files: GitFileStatus[];
};

export function RepositorySidebar({ files }: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SidebarSection title="Changes" defaultOpen className="flex-[2_1_260px]">
        <FileTree files={files} />
      </SidebarSection>
      <SidebarSection title="Branches" defaultOpen className="min-h-[180px]">
        <BranchList />
      </SidebarSection>
      <SidebarSection title="Tags" defaultOpen={false} className="min-h-[120px]">
        <TagList />
      </SidebarSection>
    </div>
  );
}

function SidebarSection({
  title,
  defaultOpen,
  className,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
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
