import { createMemo, type Accessor } from "solid-js";
import type { GitStatusSummary } from "../types.js";

/**
 * Header component - Displays current branch and status information
 */
export interface HeaderProps {
  status: Accessor<GitStatusSummary | null>;
}

export function Header(props: HeaderProps) {
  const branchName = () => props.status()?.current || "unknown";
  const ahead = () => props.status()?.ahead || 0;
  const behind = () => props.status()?.behind || 0;
  const fileCount = () => props.status()?.files.length || 0;
  const isClean = () => props.status()?.isClean ?? true;

  const statusText = createMemo(() => {
    if (isClean()) {
      return "clean";
    }
    const parts = [];
    if (fileCount() > 0) parts.push(`${fileCount()} file${fileCount() > 1 ? "s" : ""}`);
    if (ahead() > 0) parts.push(`↑${ahead()}`);
    if (behind() > 0) parts.push(`↓${behind()}`);
    return parts.join(" ");
  });

  return (
    <box
      borderStyle="single"
      borderColor="#00AAFF"
      width="100%"
      height={3}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
    >
      <text fg="#00FF00">
        {`⎇ ${branchName()}`}
      </text>
      <text fg={isClean() ? "#44FF44" : "#FFAA00"}>
        {statusText()}
      </text>
    </box>
  );
}
