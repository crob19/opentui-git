import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react/index.js";
import {
  BranchesDocument,
  CreateTagDocument,
  PushTagDocument,
  StatusDocument,
  TagsDocument,
} from "@opentui-git/client";
import { Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateTagDialog } from "./BranchDialogs.js";

const REFETCH = [
  { query: TagsDocument },
  { query: BranchesDocument },
  { query: StatusDocument },
];

export function TagList() {
  const { data, loading, error } = useQuery(TagsDocument, {
    pollInterval: 10000,
  });
  const tags = [...(data?.tags ?? [])].sort((a, b) => a.localeCompare(b));
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [createTag, createState] = useMutation(CreateTagDocument, {
    refetchQueries: REFETCH,
  });
  const [pushTag, pushState] = useMutation(PushTagDocument, {
    refetchQueries: REFETCH,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "t") {
        event.preventDefault();
        setIsCreateOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const push = async (name: string) => {
    try {
      await pushTag({ variables: { name } });
      toast.success(`Pushed ${name}`);
    } catch (err) {
      toast.error(`Push tag failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
        <span className="text-[11px] text-muted-foreground">
          {tags.length} tag{tags.length === 1 ? "" : "s"}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          title="New tag"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus />
          <span className="sr-only">New tag</span>
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {loading && !data ? (
          <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
            Loading...
          </div>
        ) : error ? (
          <div className="px-3 py-2 text-xs text-destructive">
            {error.message}
          </div>
        ) : tags.length === 0 ? (
          <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
            No tags
          </div>
        ) : (
          <div className="py-1">
            {tags.map((tag) => (
              <ContextMenu key={tag}>
                <ContextMenuTrigger asChild>
                  <div className="flex min-h-7 cursor-pointer select-none items-center gap-2 px-2 py-1 text-[13px] hover:bg-accent/50">
                    <Tag className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-mono">
                      {tag}
                    </span>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem
                    disabled={pushState.loading}
                    onSelect={() => push(tag)}
                  >
                    Push tag
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        )}
      </ScrollArea>

      <CreateTagDialog
        open={isCreateOpen}
        loading={createState.loading}
        onOpenChange={setIsCreateOpen}
        onSubmit={async (name) => {
          try {
            await createTag({ variables: { name } });
            setIsCreateOpen(false);
            toast.success(`Created tag ${name}`);
          } catch (err) {
            toast.error(`Create tag failed: ${(err as Error).message}`);
          }
        }}
      />
    </div>
  );
}
