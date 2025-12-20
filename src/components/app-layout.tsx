import { Show, type Accessor, type Resource, type JSXElement } from "solid-js";
import type { GitStatusSummary, GitFileStatus, FileTreeNode } from "../types.js";
import type { PanelType } from "../commands/types.js";
import { Header } from "./header.js";
import { FileList } from "./file-list.js";
import { BranchList } from "./branch-list.js";
import { DiffViewer } from "./diff-viewer.js";
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
  /** Diff content resource */
  diffContent: Resource<string | null>;
  /** Currently selected file */
  selectedFile: Accessor<GitFileStatus | null>;
  /** Selected file index */
  selectedIndex: Accessor<number>;
  /** Selected branch index */
  branchSelectedIndex: Accessor<number>;
  /** Active panel (files or branches) */
  activePanel: Accessor<PanelType>;
  /** Whether in a git repository */
  isGitRepo: Accessor<boolean>;
  /** Current error message if any */
  errorMessage: Accessor<string | null>;
  /** Whether diff is currently loading */
  isDiffLoading: Accessor<boolean>;
  /** Flattened tree nodes for file tree */
  flatNodes: Accessor<FileTreeNode[]>;
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
                selectedIndex={props.branchSelectedIndex}
                isActive={() => props.activePanel() === "branches"}
              />
            </box>
          </box>
          <box width="70%" flexDirection="column">
            <DiffViewer
              diff={() => props.diffContent() || null}
              filePath={() => props.selectedFile()?.path || null}
              isLoading={props.isDiffLoading}
            />
          </box>
        </box>
        <Footer activePanel={props.activePanel} />
      </Show>
    </box>
  );
}
