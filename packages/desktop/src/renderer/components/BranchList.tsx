import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react/index.js";
import {
  BranchesDocument,
  CheckoutBranchDocument,
  CreateBranchDocument,
  DeleteBranchDocument,
  MergeBranchDocument,
  RenameBranchDocument,
  StatusDocument,
  type BranchesQuery,
} from "@opentui-git/client";
import { GitBranch, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useSelection } from "../state/selection.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { MergeBranchDialog } from "./MergeBranchDialog.js";
import { NewBranchDialog, RenameBranchDialog } from "./BranchDialogs.js";

type Branch = BranchesQuery["branches"]["branches"][number];

const REFETCH = [{ query: BranchesDocument }, { query: StatusDocument }];

export function BranchList() {
  const { resetSelection } = useSelection();
  const { data, loading, error } = useQuery(BranchesDocument, {
    pollInterval: 5000,
  });
  const branches = useMemo(
    () =>
      [...(data?.branches.branches ?? [])].sort((a, b) => {
        if (a.current) return -1;
        if (b.current) return 1;
        return a.name.localeCompare(b.name);
      }),
    [data],
  );
  const currentBranch = data?.branches.current ?? "";

  const [newBranchSource, setNewBranchSource] = useState<string | null>(null);
  const [isNewBranchOpen, setIsNewBranchOpen] = useState(false);
  const [renameBranch, setRenameBranch] = useState<Branch | null>(null);
  const [mergeBranch, setMergeBranch] = useState<Branch | null>(null);
  const [deleteBranch, setDeleteBranch] = useState<Branch | null>(null);

  const [checkoutBranch, checkoutState] = useMutation(CheckoutBranchDocument, {
    refetchQueries: REFETCH,
  });
  const [createBranch, createState] = useMutation(CreateBranchDocument, {
    refetchQueries: REFETCH,
  });
  const [renameBranchMutation, renameState] = useMutation(
    RenameBranchDocument,
    { refetchQueries: REFETCH },
  );
  const [deleteBranchMutation, deleteState] = useMutation(
    DeleteBranchDocument,
    { refetchQueries: REFETCH },
  );
  const [mergeBranchMutation, mergeState] = useMutation(MergeBranchDocument, {
    refetchQueries: REFETCH,
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setNewBranchSource(null);
        setIsNewBranchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const checkout = async (branch: Branch) => {
    if (branch.current || checkoutState.loading) return;
    try {
      await checkoutBranch({ variables: { name: branch.name } });
      resetSelection();
      toast.success(`Checked out ${branch.name}`);
    } catch (err) {
      toast.error(`Checkout failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
        <span className="text-[11px] text-muted-foreground">
          {branches.length} branch{branches.length === 1 ? "" : "es"}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          title="New branch"
          onClick={() => {
            setNewBranchSource(null);
            setIsNewBranchOpen(true);
          }}
        >
          <Plus />
          <span className="sr-only">New branch</span>
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
        ) : branches.length === 0 ? (
          <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
            No branches
          </div>
        ) : (
          <div className="py-1">
            {branches.map((branch) => (
              <BranchRow
                key={branch.name}
                branch={branch}
                disabled={checkoutState.loading}
                onCheckout={() => checkout(branch)}
                onNewFrom={() => {
                  setNewBranchSource(branch.name);
                  setIsNewBranchOpen(true);
                }}
                onRename={() => setRenameBranch(branch)}
                onMerge={() => setMergeBranch(branch)}
                onDelete={() => setDeleteBranch(branch)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <NewBranchDialog
        open={isNewBranchOpen}
        source={newBranchSource}
        loading={createState.loading}
        onOpenChange={setIsNewBranchOpen}
        onSubmit={async (name) => {
          try {
            await createBranch({
              variables: { name, source: newBranchSource ?? undefined },
            });
            resetSelection();
            setIsNewBranchOpen(false);
            toast.success(`Created ${name}`);
          } catch (err) {
            toast.error(`Create branch failed: ${(err as Error).message}`);
          }
        }}
      />

      {renameBranch && (
        <RenameBranchDialog
          open={Boolean(renameBranch)}
          branchName={renameBranch.name}
          defaultValue={renameBranch.name}
          loading={renameState.loading}
          onOpenChange={(open) => !open && setRenameBranch(null)}
          onSubmit={async (newName) => {
            try {
              await renameBranchMutation({
                variables: { oldName: renameBranch.name, newName },
              });
              setRenameBranch(null);
              toast.success(`Renamed branch to ${newName}`);
            } catch (err) {
              toast.error(`Rename failed: ${(err as Error).message}`);
            }
          }}
        />
      )}

      {mergeBranch && (
        <MergeBranchDialog
          open={Boolean(mergeBranch)}
          branchName={mergeBranch.name}
          currentBranch={currentBranch}
          loading={mergeState.loading}
          onOpenChange={(open) => !open && setMergeBranch(null)}
          onConfirm={async () => {
            try {
              const result = await mergeBranchMutation({
                variables: { name: mergeBranch.name },
              });
              setMergeBranch(null);
              const conflicts = result.data?.mergeBranch.conflicts ?? [];
              if (conflicts.length > 0) {
                toast.error(`Merge has ${conflicts.length} conflict(s)`);
              } else {
                toast.success(`Merged ${mergeBranch.name}`);
              }
            } catch (err) {
              toast.error(`Merge failed: ${(err as Error).message}`);
            }
          }}
        />
      )}

      {deleteBranch && (
        <ConfirmDialog
          open={Boolean(deleteBranch)}
          title="Delete Branch"
          description={`Delete local branch ${deleteBranch.name}?`}
          confirmLabel="Delete"
          variant="destructive"
          loading={deleteState.loading}
          onOpenChange={(open) => !open && setDeleteBranch(null)}
          onConfirm={async () => {
            try {
              await deleteBranchMutation({
                variables: { name: deleteBranch.name, force: false },
              });
              setDeleteBranch(null);
              toast.success(`Deleted ${deleteBranch.name}`);
            } catch (err) {
              toast.error(`Delete failed: ${(err as Error).message}`);
            }
          }}
        />
      )}
    </div>
  );
}

function BranchRow({
  branch,
  disabled,
  onCheckout,
  onNewFrom,
  onRename,
  onMerge,
  onDelete,
}: {
  branch: Branch;
  disabled: boolean;
  onCheckout: () => void;
  onNewFrom: () => void;
  onRename: () => void;
  onMerge: () => void;
  onDelete: () => void;
}) {
  const row = (
    <div
      role="button"
      tabIndex={0}
      onDoubleClick={onCheckout}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onCheckout();
        }
      }}
      className={cn(
        "flex min-h-7 cursor-pointer select-none items-center gap-2 px-2 py-1 text-[13px] hover:bg-accent/50",
        branch.current && "bg-accent text-accent-foreground",
      )}
    >
      <GitBranch
        className={cn(
          "size-3.5 shrink-0",
          branch.current ? "text-git-branch" : "text-muted-foreground",
        )}
      />
      <span className="min-w-0 flex-1 truncate font-mono">{branch.name}</span>
      {branch.ahead > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
          ↑{branch.ahead}
        </Badge>
      )}
      {branch.behind > 0 && (
        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
          ↓{branch.behind}
        </Badge>
      )}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={branch.current || disabled} onSelect={onCheckout}>
          Checkout
        </ContextMenuItem>
        <ContextMenuItem onSelect={onNewFrom}>New branch from here</ContextMenuItem>
        <ContextMenuItem onSelect={onRename}>Rename</ContextMenuItem>
        <ContextMenuItem disabled={branch.current} onSelect={onMerge}>
          Merge into current
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={branch.current}
          variant="destructive"
          onSelect={onDelete}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
