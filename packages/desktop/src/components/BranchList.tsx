import { For, Show, type Accessor } from "solid-js";

export interface BranchListProps {
  branches: Accessor<string[]>;
  currentBranch: Accessor<string>;
  onCheckout: (branch: string) => void;
  checkingOut: Accessor<string | null>;
}

/**
 * BranchList component - Shows local branches with checkout ability
 */
export function BranchList(props: BranchListProps) {
  return (
    <div class="flex flex-col h-full border border-app-border rounded bg-app-surface">
      {/* Header */}
      <div class="flex items-center justify-between px-3 py-2 border-b border-app-border">
        <div class="flex items-center gap-2">
          <span class="text-app-accent font-medium">Branches</span>
          <span class="text-app-text-muted text-sm">({props.branches().length})</span>
        </div>
      </div>

      {/* Branch List */}
      <div class="flex-1 overflow-y-auto scrollbar-thin">
        <Show
          when={props.branches().length > 0}
          fallback={
            <div class="flex items-center justify-center h-full text-app-text-muted text-sm">
              No branches
            </div>
          }
        >
          <For each={props.branches()}>
            {(branch) => {
              const isCurrent = () => branch === props.currentBranch();
              const isCheckingOut = () => props.checkingOut() === branch;

              return (
                <div
                  class={`
                    flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors
                    ${isCurrent() ? "bg-app-accent/10 border-l-2 border-app-accent" : "hover:bg-white/5"}
                    ${isCheckingOut() ? "opacity-50 cursor-wait" : ""}
                  `}
                  onClick={() => !isCurrent() && !isCheckingOut() && props.onCheckout(branch)}
                >
                  {/* Current branch indicator */}
                  <span class={`w-4 text-center ${isCurrent() ? "text-app-accent" : "text-transparent"}`}>
                    {isCurrent() ? "*" : ""}
                  </span>

                  {/* Branch name */}
                  <span class={`flex-1 text-sm ${isCurrent() ? "text-app-accent font-medium" : "text-app-text"}`}>
                    {branch}
                  </span>

                  {/* Loading indicator */}
                  <Show when={isCheckingOut()}>
                    <span class="text-xs text-app-text-muted italic">switching...</span>
                  </Show>
                </div>
              );
            }}
          </For>
        </Show>
      </div>
    </div>
  );
}
