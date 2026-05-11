import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@apollo/client/react/index.js";
import {
  BranchesDocument,
  CheckoutBranchDocument,
  CreateBranchDocument,
  DefaultBranchDocument,
  DeleteBranchDocument,
  MergeBranchDocument,
  RepoInfoDocument,
  RenameBranchDocument,
  StatusDocument,
  type BranchesQuery,
} from "@opentui-git/client";
import { ChevronDown, ChevronRight, GitBranch, Plus } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useSelection } from "../state/selection.js";
import { buildGitHubPullRequestUrl } from "../lib/github.js";
import { ConfirmDialog } from "./ConfirmDialog.js";
import { MergeBranchDialog } from "./MergeBranchDialog.js";
import {
  NewBranchDialog,
  RenameBranchDialog,
} from "./BranchDialogs.js";
import { OpenPullRequestDialog } from "./OpenPullRequestDialog.js";

type Branch = BranchesQuery["branches"]["branches"][number];

const REFETCH = [{ query: BranchesDocument }, { query: StatusDocument }];

type Props = {
  refreshSignal?: number;
};

export function BranchList({ refreshSignal = 0 }: Props) {
  const { invalidateDiffTabs } = useSelection();
  const { data, loading, error, refetch } = useQuery(BranchesDocument);
  const repoInfoQuery = useQuery(RepoInfoDocument);
  const defaultBranchQuery = useQuery(DefaultBranchDocument);

  useEffect(() => {
    if (refreshSignal === 0) return;
    void refetch();
  }, [refreshSignal, refetch]);

  const branches = useMemo(
    () =>
      [...(data?.branches.branches ?? [])].sort((a, b) => {
        if (a.current) return -1;
        if (b.current) return 1;
        return a.name.localeCompare(b.name);
      }),
    [data],
  );
  const localBranches = useMemo(
    () => branches.filter((branch) => !isRemoteBranch(branch)),
    [branches],
  );
  const remoteGroups = useMemo(() => groupRemoteBranches(branches), [branches]);
  const remoteCount = remoteGroups.reduce(
    (count, group) => count + group.branches.length,
    0,
  );
  const currentBranch = data?.branches.current ?? "";

  const [newBranchSource, setNewBranchSource] = useState<string | null>(null);
  const [branchTab, setBranchTab] = useState("local");
  const [isNewBranchOpen, setIsNewBranchOpen] = useState(false);
  const [renameBranch, setRenameBranch] = useState<Branch | null>(null);
  const [mergeBranch, setMergeBranch] = useState<Branch | null>(null);
  const [deleteBranch, setDeleteBranch] = useState<Branch | null>(null);
  const [pullRequestBranch, setPullRequestBranch] = useState<Branch | null>(
    null,
  );

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
      invalidateDiffTabs();
      toast.success(`Checked out ${branch.name}`);
    } catch (err) {
      toast.error(`Checkout failed: ${(err as Error).message}`);
    }
  };

  const defaultBranch = defaultBranchQuery.data?.defaultBranch ?? "main";
  const remoteUrl = repoInfoQuery.data?.repoInfo.remoteUrl ?? null;
  const pullRequestHead = pullRequestBranch
    ? branchNameForPullRequest(pullRequestBranch)
    : "";
  const pullRequestUrl = pullRequestBranch
    ? buildGitHubPullRequestUrl(remoteUrl, defaultBranch, pullRequestHead)
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-2 py-1.5">
        <span className="text-[11px] text-muted-foreground">
          {localBranches.length + remoteCount} branch
          {localBranches.length + remoteCount === 1 ? "" : "es"}
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
        <Tabs
          value={branchTab}
          onValueChange={setBranchTab}
          className="min-h-0 flex-1 gap-0"
        >
          <div className="border-b border-border px-2 py-1.5">
            <TabsList className="grid h-7 w-full grid-cols-2 rounded-md">
              <TabsTrigger value="local" className="text-[11px]">
                Local ({localBranches.length})
              </TabsTrigger>
              <TabsTrigger value="remote" className="text-[11px]">
                Remote ({remoteCount})
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="local" className="min-h-0 flex-1">
            <ScrollArea className="h-full min-h-0">
              <BranchGroup title="Local" count={localBranches.length} defaultOpen>
                {localBranches.length === 0 ? (
                  <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
                    No local branches
                  </div>
                ) : (
                  localBranches.map((branch) => (
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
                      onOpenPullRequest={() => setPullRequestBranch(branch)}
                      onDelete={() => setDeleteBranch(branch)}
                    />
                  ))
                )}
              </BranchGroup>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="remote" className="min-h-0 flex-1">
            <ScrollArea className="h-full min-h-0">
              <div className="py-1">
                {remoteGroups.length === 0 ? (
                  <div className="px-3 py-2 text-xs italic text-muted-foreground/60">
                    No remote branches
                  </div>
                ) : (
                  remoteGroups.map((group) => (
                    <BranchGroup
                      key={group.remote}
                      title={group.remote}
                      count={group.branches.length}
                      defaultOpen
                    >
                      {group.branches.map((branch) => (
                        <BranchRow
                          key={branch.name}
                          branch={branch}
                          disabled
                          onCheckout={() => checkout(branch)}
                          onNewFrom={() => {
                            setNewBranchSource(branch.name);
                            setIsNewBranchOpen(true);
                          }}
                          onRename={() => setRenameBranch(branch)}
                          onMerge={() => setMergeBranch(branch)}
                          onOpenPullRequest={() =>
                            setPullRequestBranch(branch)
                          }
                          onDelete={() => setDeleteBranch(branch)}
                        />
                      ))}
                    </BranchGroup>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      )}

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
            invalidateDiffTabs();
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

      {pullRequestBranch && (
        <OpenPullRequestDialog
          open={Boolean(pullRequestBranch)}
          baseBranch={defaultBranch}
          headBranch={pullRequestHead}
          url={pullRequestUrl}
          onOpenChange={(open) => !open && setPullRequestBranch(null)}
          onOpenPullRequest={() => {
            if (!pullRequestUrl) return;
            window.open(pullRequestUrl, "_blank", "noopener,noreferrer");
            setPullRequestBranch(null);
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
  onOpenPullRequest,
  onDelete,
}: {
  branch: Branch;
  disabled: boolean;
  onCheckout: () => void;
  onNewFrom: () => void;
  onRename: () => void;
  onMerge: () => void;
  onOpenPullRequest: () => void;
  onDelete: () => void;
}) {
  const remote = isRemoteBranch(branch);
  const displayName = remote ? displayRemoteBranchName(branch.name) : branch.name;
  const row = (
    <div
      role="button"
      tabIndex={0}
      onDoubleClick={() => {
        if (!remote) onCheckout();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          if (!remote) onCheckout();
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
      <span className="min-w-0 flex-1 truncate font-mono">{displayName}</span>
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
        <ContextMenuItem
          disabled={branch.current || disabled || remote}
          onSelect={onCheckout}
        >
          Checkout
        </ContextMenuItem>
        <ContextMenuItem onSelect={onNewFrom}>New branch from here</ContextMenuItem>
        <ContextMenuItem onSelect={onOpenPullRequest}>
          Open pull request
        </ContextMenuItem>
        <ContextMenuItem disabled={remote} onSelect={onRename}>
          Rename
        </ContextMenuItem>
        <ContextMenuItem disabled={branch.current} onSelect={onMerge}>
          Merge into current
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={branch.current || remote}
          variant="destructive"
          onSelect={onDelete}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function BranchGroup({
  title,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex h-7 w-full items-center gap-1.5 px-2 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:bg-accent/40">
        {open ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <span className="text-muted-foreground/70">{count}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function isRemoteBranch(branch: Branch): boolean {
  return branch.name.startsWith("remotes/");
}

function displayRemoteBranchName(name: string): string {
  return name.replace(/^remotes\/[^/]+\//, "");
}

function branchNameForPullRequest(branch: Branch): string {
  return isRemoteBranch(branch)
    ? displayRemoteBranchName(branch.name)
    : branch.name;
}

function groupRemoteBranches(branches: Branch[]): Array<{
  remote: string;
  branches: Branch[];
}> {
  const groups = new Map<string, Branch[]>();

  for (const branch of branches) {
    if (!isRemoteBranch(branch) || branch.name.endsWith("/HEAD")) continue;
    const [, remote = "remote"] = branch.name.split("/");
    const group = groups.get(remote) ?? [];
    group.push(branch);
    groups.set(remote, group);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([remote, groupBranches]) => ({
      remote,
      branches: groupBranches.sort((a, b) =>
        displayRemoteBranchName(a.name).localeCompare(
          displayRemoteBranchName(b.name),
        ),
      ),
    }));
}
