import { Show, type Accessor } from "solid-js";
import type { GitStatusSummary } from "@opentui-git/core/git/types";

export interface HeaderProps {
  status: Accessor<GitStatusSummary | null>;
  repoPath: Accessor<string>;
  connected: Accessor<boolean>;
}

/**
 * Header component showing repository info and status
 */
export function Header(props: HeaderProps) {
  const fileCount = () => props.status()?.files.length ?? 0;
  const isClean = () => props.status()?.isClean ?? true;
  const currentBranch = () => props.status()?.current ?? "";
  const ahead = () => props.status()?.ahead ?? 0;
  const behind = () => props.status()?.behind ?? 0;

  return (
    <header class="flex items-center justify-between px-6 py-4 border-b border-app-border bg-app-surface">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-semibold text-app-text">opentui-git</h1>
        <Show when={props.connected()}>
          <span class="text-xs px-2 py-1 rounded bg-green-900/50 text-green-400">
            Connected
          </span>
        </Show>
      </div>

      <Show when={props.status()}>
        <div class="flex items-center gap-6">
          {/* Current Branch */}
          <div class="flex items-center gap-2">
            <span class="text-app-accent">*</span>
            <span class="font-medium text-app-text">{currentBranch()}</span>
            <Show when={ahead() > 0 || behind() > 0}>
              <span class="text-xs text-app-text-muted">
                <Show when={ahead() > 0}>
                  <span class="text-green-400">+{ahead()}</span>
                </Show>
                <Show when={ahead() > 0 && behind() > 0}> / </Show>
                <Show when={behind() > 0}>
                  <span class="text-red-400">-{behind()}</span>
                </Show>
              </span>
            </Show>
          </div>

          {/* Status */}
          <div class="text-sm">
            <Show
              when={!isClean()}
              fallback={<span class="text-green-400">Clean</span>}
            >
              <span class="text-git-modified">{fileCount()} files changed</span>
            </Show>
          </div>

          {/* Repository Path */}
          <div class="text-xs text-app-text-muted max-w-[300px] truncate">
            {props.repoPath()}
          </div>
        </div>
      </Show>
    </header>
  );
}
