import { formatCommentBatch } from "opentui-git/shared/comments";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "../ui/button.js";
import { useComments } from "../../state/comments.js";
import {
  hasTerminalSession,
  writeToTerminal,
} from "../../lib/terminalSession.js";

export function CommentToolbar({
  projectId,
  filePath,
}: {
  projectId: string;
  filePath: string;
}) {
  const comments = useComments();
  const fileComments = comments.forFile(filePath);

  if (fileComments.length === 0) return null;

  const send = () => {
    if (!hasTerminalSession(projectId)) {
      toast.error("Open the terminal first so the agent is running.");
      return;
    }
    const note = formatCommentBatch(fileComments);
    const ok = writeToTerminal(projectId, note + "\r");
    if (!ok) {
      toast.error("Couldn't reach the terminal.");
      return;
    }
    toast.success(
      `Sent ${fileComments.length} comment${fileComments.length === 1 ? "" : "s"}.`,
    );
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs"
        onClick={send}
        title="Send comments to terminal"
      >
        <Send className="mr-1 h-3.5 w-3.5" />
        Send to terminal
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs"
        onClick={() => comments.removeForFile(filePath)}
        title="Clear comments for this file"
      >
        Clear
      </Button>
      <div className="mx-1 h-4 w-px bg-border/40" />
    </>
  );
}
