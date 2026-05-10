import { useApolloClient, useMutation } from "@apollo/client/react/index.js";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpToLine,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  BranchesDocument,
  FetchDocument,
  ForcePushDocument,
  PullDocument,
  PushDocument,
  StatusDocument,
  TagsDocument,
} from "@opentui-git/client";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog.js";

const REFETCH = [StatusDocument, BranchesDocument, TagsDocument];

type Props = {
  ahead: number;
  behind: number;
};

export function RemoteActions({ ahead, behind }: Props) {
  const client = useApolloClient();
  const [isForcePushOpen, setIsForcePushOpen] = useState(false);
  const [pull, pullState] = useMutation(PullDocument);
  const [push, pushState] = useMutation(PushDocument);
  const [forcePush, forcePushState] = useMutation(ForcePushDocument);
  const [runFetch, fetchState] = useMutation(FetchDocument);

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
      <div className="sb-actions">
        <button
          type="button"
          className="sb-btn"
          title="Fetch from remote"
          disabled={fetchState.loading}
          onClick={() => run("Fetch", () => runFetch(), "Fetched from remote")}
        >
          <RefreshCw className={fetchState.loading ? "animate-spin" : ""} />
          <span>Fetch</span>
        </button>
        <button
          type="button"
          className={cn("sb-btn", behind > 0 && "hot")}
          title={
            behind > 0
              ? `Pull ${behind} commit${behind === 1 ? "" : "s"} from remote`
              : "Pull from remote"
          }
          disabled={pullState.loading}
          onClick={() => run("Pull", () => pull(), "Pulled from remote")}
        >
          <ArrowDownToLine />
          <span>Pull</span>
          {behind > 0 && <span className="ct">{behind}</span>}
        </button>
        <button
          type="button"
          className={cn("sb-btn", ahead > 0 && "hot")}
          title={
            ahead > 0
              ? `Push ${ahead} commit${ahead === 1 ? "" : "s"} to remote`
              : "Push to remote"
          }
          disabled={pushState.loading}
          onClick={() => run("Push", () => push(), "Pushed to remote")}
        >
          <ArrowUpToLine />
          <span>Push</span>
          {ahead > 0 && <span className="ct">{ahead}</span>}
        </button>
        <button
          type="button"
          className="sb-btn danger"
          title="Force push with lease"
          disabled={forcePushState.loading}
          onClick={() => setIsForcePushOpen(true)}
        >
          <AlertTriangle />
        </button>
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
          await run("Force push", () => forcePush(), "Force pushed with lease");
          setIsForcePushOpen(false);
        }}
      />
    </>
  );
}
