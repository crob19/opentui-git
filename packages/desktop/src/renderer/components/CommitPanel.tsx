import { useMutation } from "@apollo/client/react/index.js";
import { useState } from "react";
import { toast } from "sonner";
import { CommitDocument, StatusDocument } from "@opentui-git/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  stagedCount: number;
  stagedPaths: string[];
};

export function CommitPanel({ stagedCount, stagedPaths }: Props) {
  const [message, setMessage] = useState("");
  const [commit, { loading }] = useMutation(CommitDocument, {
    refetchQueries: [{ query: StatusDocument }],
  });

  const trimmed = message.trim();
  const canCommit = stagedCount > 0 && trimmed.length > 0 && !loading;

  const submit = async () => {
    if (!canCommit) return;
    try {
      const res = await commit({ variables: { message: trimmed } });
      if (res.data?.commit?.success) {
        toast.success(
          `Committed ${stagedCount} file${stagedCount === 1 ? "" : "s"}`,
        );
        setMessage("");
      } else {
        toast.error("Commit failed");
      }
    } catch (err) {
      toast.error(`Commit failed: ${(err as Error).message}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 border-t border-border bg-card/50">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Commit
        </span>
        <span className="text-[11px] text-muted-foreground/70">
          {stagedCount} file{stagedCount === 1 ? "" : "s"} staged
        </span>
      </div>

      {stagedCount > 0 && (
        <ScrollArea className="max-h-24 rounded border border-border bg-background/50 px-2 py-1">
          <ul className="text-xs text-muted-foreground font-mono">
            {stagedPaths.slice(0, 8).map((p) => (
              <li key={p} className="py-0.5 truncate">
                {p}
              </li>
            ))}
            {stagedPaths.length > 8 && (
              <li className="py-0.5 text-muted-foreground/60 italic">
                …and {stagedPaths.length - 8} more
              </li>
            )}
          </ul>
        </ScrollArea>
      )}

      <Textarea
        placeholder="Commit message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        className="font-mono text-[13px] resize-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground/70">
          {canCommit ? "⌘+Enter to commit" : ""}
        </span>
        <Button onClick={submit} disabled={!canCommit} size="sm">
          {loading ? "Committing…" : "Commit"}
        </Button>
      </div>
    </div>
  );
}
