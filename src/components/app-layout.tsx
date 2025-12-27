import { Show, type Accessor, type Setter, type Resource, type JSXElement } from "solid-js";
import type { GitStatusSummary, GitFileStatus, FileTreeNode } from "../types.js";
import type { PanelType } from "../commands/types.js";
import type { BranchPanelTab } from "../app.js";
import type { GitService } from "../git-service.js";
import { Header } from "./header.js";
import { FileList } from "./file-list.js";
import { BranchList } from "./branch-list.js";
import { DiffViewer } from "./diff-viewer.js";
import { FullPageDiffViewer } from "./full-page-diff-viewer.js";
import { FileEditor } from "./file-editor.js";
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
  /** Diff view mode setter */
  setDiffViewMode: Setter<"unified" | "side-by-side">;
  /** Edit mode state */
  isEditMode: Accessor<boolean>;
  /** Edit mode setter */
  setIsEditMode: Setter<boolean>;
  /** Edited content state */
  editedContent: Accessor<string>;
  /** Edited content setter */
  setEditedContent: Setter<string>;
  /** All edited lines in current session */
  editedLines: Accessor<Map<number, string>>;
  /** Setter for edited lines */
  setEditedLines: Setter<Map<number, string>>;
  /** Full file content for edit mode */
  fileContent: Accessor<string>;
  /** Setter for file content */
  setFileContent: Setter<string>;
  /** Selected line number in full file */
  selectedLine: Accessor<number>;
  /** Setter for selected line */
  setSelectedLine: Setter<number>;
  /** Git service for file operations */
  gitService: GitService;
  /** Refetch diff after save */
  refetchDiff: () => void;
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
        {/* Show file editor when in edit mode, otherwise show diff viewer */}
        <Show when={props.activePanel() === "diff"}>
          <Show
            when={props.isEditMode()}
            fallback={
              <FullPageDiffViewer
                diff={() => props.diffContent() || null}
                filePath={() => props.selectedFile()?.path || null}
                isLoading={props.isDiffLoading}
                selectedRow={props.selectedDiffRow}
                setSelectedRow={props.setSelectedDiffRow}
                viewMode={props.diffViewMode}
                setViewMode={props.setDiffViewMode}
                isEditMode={props.isEditMode}
                setIsEditMode={props.setIsEditMode}
                editedContent={props.editedContent}
                setEditedContent={props.setEditedContent}
                editedLines={props.editedLines}
                setEditedLines={props.setEditedLines}
                gitService={props.gitService}
                refetchDiff={props.refetchDiff}
              />
            }
          >
            <FileEditor
              filePath={() => props.selectedFile()?.path || null}
              fileContent={props.fileContent}
              selectedLine={props.selectedLine}
              setSelectedLine={props.setSelectedLine}
              editedContent={props.editedContent}
              setEditedContent={props.setEditedContent}
              editedLines={props.editedLines}
            />
          </Show>
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
