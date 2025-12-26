import { Show, type Accessor, type Setter, type Resource, type JSXElement } from "solid-js";
import type { GitStatusSummary, GitFileStatus, FileTreeNode } from "../types.js";
import type { PanelType } from "../commands/types.js";
import type { BranchPanelTab } from "../app.js";
import { Header } from "./header.js";
import { FileList } from "./file-list.js";
import { BranchList } from "./branch-list.js";
import { DiffViewer } from "./diff-viewer.js";
import { FullPageDiffViewer } from "./full-page-diff-viewer.js";
import { Footer } from "./footer.js";

/**
 * Props for the AppLayout component
 */
export interface AppLayoutProps {
  /** Git status resource */
  gitStatus: Resource<GitStatusSummary>;
  /** Local branches list */
  localBranches: Accessor<string[]>;
  /** Current branch name */
  currentBranch: Accessor<string>;
  /** All tags list */
  allTags: Accessor<string[]>;
  /** Diff content resource */
  diffContent: Resource<string | null>;
  /** Currently selected file */
  selectedFile: Accessor<GitFileStatus | null>;
  /** Selected file index */
  selectedIndex: Accessor<number>;
  /** Selected branch index */
  branchSelectedIndex: Accessor<number>;
  /** Selected tag index */
  tagSelectedIndex: Accessor<number>;
  /** Active panel (files or branches) */
  activePanel: Accessor<PanelType>;
  /** Branch panel tab (branches or tags) */
  branchPanelTab: Accessor<BranchPanelTab>;
  /** Whether in a git repository */
  isGitRepo: Accessor<boolean>;
  /** Current error message if any */
  errorMessage: Accessor<string | null>;
  /** Whether diff is currently loading */
  isDiffLoading: Accessor<boolean>;
  /** Flattened tree nodes for file tree */
  flatNodes: Accessor<FileTreeNode[]>;
  /** Selected diff row index */
  selectedDiffRow: Accessor<number>;
  /** Selected diff row setter */
  setSelectedDiffRow: Setter<number>;
  /** Diff view mode */
  diffViewMode: Accessor<"unified" | "side-by-side">;
}

/**
 * Main application layout component
 * Displays the git status, file list, branch list, and diff viewer
 * Shows error state when not in a git repository
 * @param props - AppLayout properties
 * @returns Application layout component
 */
export function AppLayout(props: AppLayoutProps): JSXElement {
  return (
    <box width="100%" height="100%" flexDirection="column">
      <Show
        when={props.isGitRepo() && !props.errorMessage()}
        fallback={
          <box
            width="100%"
            height="100%"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
          >
            <text fg="#FF4444">Error</text>
            <text fg="#AAAAAA">{props.errorMessage() || "Not a git repository"}</text>
            <text fg="#888888">Press 'q' to quit</text>
          </box>
        }
      >
        {/* Show full-page diff viewer when in diff panel */}
        <Show when={props.activePanel() === "diff"}>
          <FullPageDiffViewer
            diff={() => props.diffContent() || null}
            filePath={() => props.selectedFile()?.path || null}
            isLoading={props.isDiffLoading}
            selectedRow={props.selectedDiffRow}
            setSelectedRow={props.setSelectedDiffRow}
            viewMode={props.diffViewMode}
            setViewMode={() => {}} // View mode is controlled by keyboard handler
          />
        </Show>

        {/* Normal 3-panel layout when NOT in diff panel */}
        <Show when={props.activePanel() !== "diff"}>
          <Header status={() => props.gitStatus() || null} />
          <box flexDirection="row" flexGrow={1} gap={0}>
            <box width="30%" flexDirection="column">
              <box height="60%" flexDirection="column">
                <FileList
                  files={() => props.gitStatus()?.files || []}
                  flatNodes={props.flatNodes}
                  selectedIndex={props.selectedIndex}
                  isActive={() => props.activePanel() === "files"}
                />
              </box>
              <box height="40%" flexDirection="column">
                <BranchList
                  branches={props.localBranches}
                  currentBranch={props.currentBranch}
                  branchSelectedIndex={props.branchSelectedIndex}
                  tags={props.allTags}
                  tagSelectedIndex={props.tagSelectedIndex}
                  currentTab={props.branchPanelTab}
                  isActive={() => props.activePanel() === "branches"}
                />
              </box>
            </box>
            <box width="70%" flexDirection="column">
              <DiffViewer
                diff={() => props.diffContent() || null}
                filePath={() => props.selectedFile()?.path || null}
                isLoading={props.isDiffLoading}
                isActive={() => false}
                selectedLine={() => 0}
                setSelectedLine={() => {}}
              />
            </box>
          </box>
          <Footer activePanel={props.activePanel} />
        </Show>
      </Show>
    </box>
  );
}
