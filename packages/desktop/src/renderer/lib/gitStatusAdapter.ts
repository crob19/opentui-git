import type { GitStatusEntry, GitStatus } from "@pierre/trees";
import type { FileStatus } from "@opentui-git/client";

function codeToStatus(code: string): GitStatus | null {
  switch (code) {
    case "A":
      return "added";
    case "M":
    case "T":
      return "modified";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "?":
      return "untracked";
    case "!":
      return "ignored";
    default:
      return null;
  }
}

type Side = "working" | "index" | "either";

export function toGitStatusEntries(
  files: readonly FileStatus[],
  side: Side = "either",
): GitStatusEntry[] {
  const out: GitStatusEntry[] = [];
  for (const f of files) {
    const code =
      side === "working"
        ? f.workingDir
        : side === "index"
          ? f.index
          : f.workingDir !== " " && f.workingDir !== ""
            ? f.workingDir
            : f.index;
    const status = codeToStatus(code);
    if (status) out.push({ path: f.path, status });
  }
  return out;
}
