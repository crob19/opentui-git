import { useMutation } from "@apollo/client/react/index.js";
import { useState } from "react";
import {
  BranchesDocument,
  FetchDocument,
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
  { query: StatusDocument },
  { query: BranchesDocument },
  { query: TagsDocument },
];

export function RemoteToolbar() {
  const [isForcePushOpen, setIsForcePushOpen] = useState(false);
  const [pull, pullState] = useMutation(PullDocument, {
    refetchQueries: REFETCH,
  });
  const [push, pushState] = useMutation(PushDocument, {
    refetchQueries: REFETCH,
  });
  const [fetch, fetchState] = useMutation(FetchDocument, {
    refetchQueries: REFETCH,
  });

  const run = async (
    label: string,
    action: () => Promise<unknown>,
    success: string,
  ) => {
    try {
      await action();
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
          onClick={() =>
            run("Push", () => push({ variables: { force: false } }), "Pushed to remote")
          }
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
          disabled={pushState.loading}
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
        loading={pushState.loading}
        onOpenChange={setIsForcePushOpen}
        onConfirm={async () => {
          await run(
            "Force push",
            () => push({ variables: { force: true } }),
            "Force pushed with lease",
          );
          setIsForcePushOpen(false);
        }}
      />
    </>
  );
}
