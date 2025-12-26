import type { Setter } from "solid-js";
import type { GitService } from "../git-service.js";
import type { ToastContext } from "../components/toast.js";
import type { DialogContext } from "../components/dialog.js";

/**
 * Panel types in the application
 */
export type PanelType = "files" | "branches" | "diff";

/**
 * Base context required by all commands
 */
export interface CommandContext {
  /** Git service instance for git operations */
  gitService: GitService;
  /** Toast context for user notifications */
  toast: ToastContext;
  /** Dialog context for modal dialogs */
  dialog: DialogContext;
  /** Function to set error messages in app state */
  setErrorMessage: (msg: string | null) => void;
}

/**
 * Context for file-related commands (staging, committing, etc.)
 */
export interface FileCommandContext extends CommandContext {
  /** Function to refetch git status */
  refetch: () => Promise<unknown>;
}

/**
 * Context for branch-related commands (checkout, create, delete, merge)
 */
export interface BranchCommandContext extends CommandContext {
  /** Function to refetch git status */
  refetch: () => Promise<unknown>;
  /** Function to refetch branch list */
  refetchBranches: () => Promise<unknown>;
}

/**
 * Extended branch context with selection state management
 */
export interface BranchCommandWithSelectionContext extends BranchCommandContext {
  /** Function to set the selected branch index */
  setBranchSelectedIndex: Setter<number>;
}

/**
 * Context for remote operations (pull, push)
 */
export interface RemoteCommandContext extends CommandContext {
  /** Function to refetch git status */
  refetch: () => Promise<unknown>;
}

/**
 * Context for tag-related commands (create tag)
 */
export interface TagCommandContext extends CommandContext {
  /** Function to refetch git status */
  refetch: () => Promise<unknown>;
  /** Function to refetch tags list */
  refetchTags: () => Promise<unknown>;
}
