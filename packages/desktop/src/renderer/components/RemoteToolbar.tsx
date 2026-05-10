import {
  useApolloClient,
  useMutation,
} from "@apollo/client/react/index.js";
import { useState } from "react";
import {
  BranchesDocument,
  FetchDocument,
  ForcePushDocument,
  PullDocument,
  PushDocument,
  StatusDocument,
  TagsDocument,
} from "@opentui-git/client";
import { AlertTriangle, Download, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./ConfirmDialog.js";

const REFETCH = [
  StatusDocument,
  BranchesDocument,
  TagsDocument,
];

export function RemoteToolbar() {
  const client = useApolloClient();
  const [isForcePushOpen, setIsForcePushOpen] = useState(false);
  const [pull, pullState] = useMutation(PullDocument);
  const [push, pushState] = useMutation(PushDocument);
  const [forcePush, forcePushState] = useMutation(ForcePushDocument);
  const [fetch, fetchState] = useMutation(FetchDocument);

  const invalidateRepoState = async () => {
    await client.refetchQueries({
      include: REFETCH,
      updateCache(cache) {
        cache.evict({ fieldName: "status" });
        cache.evict({ fieldName: "branches" });
        cache.evict({ fieldName: "tags" });
      },
    });
    client.cache.gc();
  };

  const run = async (
    label: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    try {
      await action();
      await invalidateRepoState();
      toast.success(success);
    } catch (err) {
      toast.error(`${label} failed: ${(err as Error).message}`);
    }
  };

  return (
    <>
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border bg-card/40 px-2">
        <Button
          variant="ghost"
          size="sm"
          disabled={pullState.loading}
          onClick={() => run("Pull", () => pull(), "Pulled from remote")}
        >
          <Download />
          {pullState.loading ? "Pulling..." : "Pull"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={pushState.loading}
          onClick={() => run("Push", () => push(), "Pushed to remote")}
        >
          <Upload />
          {pushState.loading ? "Pushing..." : "Push"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={fetchState.loading}
          onClick={() => run("Fetch", () => fetch(), "Fetched from remote")}
        >
          <RefreshCw className={fetchState.loading ? "animate-spin" : ""} />
          {fetchState.loading ? "Fetching..." : "Fetch"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={forcePushState.loading}
          onClick={() => setIsForcePushOpen(true)}
        >
          <AlertTriangle />
          Force push
        </Button>
      </div>
      <ConfirmDialog
        open={isForcePushOpen}
        title="Force Push"
        description="Force push with lease to the current upstream branch?"
        confirmLabel="Force push"
        variant="destructive"
        loading={forcePushState.loading}
        onOpenChange={setIsForcePushOpen}
        onConfirm={async () => {
          await run(
            "Force push",
            () => forcePush(),
            "Force pushed with lease",
          );
          setIsForcePushOpen(false);
        }}
      />
    </>
  );
}
