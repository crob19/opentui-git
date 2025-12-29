import type { FileCommandContext } from "./types.js";
import { handleAsyncOperation } from "../utils/error-handler.js";
import { InputModal } from "../components/modals/input-modal.js";
import { getFilesInFolder } from "../utils/file-tree.js";
import type { FileTreeNode } from "../../git/types.js";

/**
 * Stage a specific file
 * @param filepath - Path to the file to stage
 * @param context - Command context with git service, toast, and refetch
 */
export async function stageFile(
  filepath: string,
  context: FileCommandContext,
): Promise<void> {
  console.log(`Staging: ${filepath}`);
  
  const result = await handleAsyncOperation(
    () => context.gitService.stageFile(filepath),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Stage file",
    },
  );

  if (result !== null) {
    context.toast.info(`Staged: ${filepath}`);
    await context.refetch();
  }
}

/**
 * Unstage a specific file
 * @param filepath - Path to the file to unstage
 * @param context - Command context with git service, toast, and refetch
 */
export async function unstageFile(
  filepath: string,
  context: FileCommandContext,
): Promise<void> {
  console.log(`Unstaging: ${filepath}`);
  
  const result = await handleAsyncOperation(
    () => context.gitService.unstageFile(filepath),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Unstage file",
    },
  );

  if (result !== null) {
    context.toast.info(`Unstaged: ${filepath}`);
    await context.refetch();
  }
}

/**
 * Stage all modified files
 * @param context - Command context with git service, toast, and refetch
 */
export async function stageAll(context: FileCommandContext): Promise<void> {
  console.log("Staging all files");
  
  const result = await handleAsyncOperation(
    () => context.gitService.stageAll(),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Stage all",
    },
  );

  if (result !== null) {
    context.toast.success("Staged all files");
    await context.refetch();
  }
}

/**
 * Unstage all staged files
 * @param context - Command context with git service, toast, and refetch
 */
export async function unstageAll(context: FileCommandContext): Promise<void> {
  console.log("Unstaging all files");
  
  const result = await handleAsyncOperation(
    () => context.gitService.unstageAll(),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Unstage all",
    },
  );

  if (result !== null) {
    context.toast.info("Unstaged all files");
    await context.refetch();
  }
}

/**
 * Commit staged files with a message
 * @param message - Commit message
 * @param context - Command context with git service, toast, and refetch
 */
export async function commit(
  message: string,
  context: FileCommandContext,
): Promise<void> {
  console.log(`Committing with message: ${message}`);
  
  const result = await handleAsyncOperation(
    () => context.gitService.commit(message),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Commit",
    },
  );

  if (result !== null) {
    console.log("Commit successful");
    context.toast.success("Commit successful");
    await context.refetch();
  }
}

/**
 * Show commit dialog for entering commit message
 * @param stagedCount - Number of staged files
 * @param context - Command context with dialog and commit logic
 */
export function showCommitDialog(
  stagedCount: number,
  context: FileCommandContext,
): void {
  if (stagedCount === 0) {
    console.log("No staged files to commit");
    context.toast.warning("No staged files to commit");
    return;
  }

  console.log(`Opening commit dialog for ${stagedCount} staged files`);
  
  context.dialog.show(
    () => {
      const modal = InputModal({
        title: `Commit ${stagedCount} staged file${stagedCount !== 1 ? "s" : ""}`,
        label: "Message:",
        placeholder: "Enter commit message...",
        height: 3,
        onSubmit: async (message: string) => {
          await commit(message, context);
        },
        onCancel: () => {
          console.log("Commit cancelled");
        },
      });
      return modal;
    },
    () => console.log("Commit dialog closed"),
  );
}

/**
 * Stage all files in a folder
 * @param folderNode - The folder tree node
 * @param context - Command context with git service, toast, and refetch
 */
export async function stageFolder(
  folderNode: FileTreeNode,
  context: FileCommandContext,
): Promise<void> {
  const files = getFilesInFolder(folderNode);
  
  if (files.length === 0) {
    context.toast.warning("No files in folder");
    return;
  }

  console.log(`Staging ${files.length} files in folder: ${folderNode.path}`);
  
  // Stage each file with error handling
  let successCount = 0;
  let errorCount = 0;
  
  for (const filepath of files) {
    try {
      await context.gitService.stageFile(filepath);
      successCount++;
    } catch (error) {
      console.error(`Failed to stage ${filepath}:`, error);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    context.toast.warning(`Staged ${successCount} file${successCount !== 1 ? "s" : ""}, ${errorCount} failed`);
  } else {
    context.toast.info(`Staged ${successCount} file${successCount !== 1 ? "s" : ""} in ${folderNode.name}`);
  }
  
  await context.refetch();
}

/**
 * Unstage all files in a folder
 * @param folderNode - The folder tree node
 * @param context - Command context with git service, toast, and refetch
 */
export async function unstageFolder(
  folderNode: FileTreeNode,
  context: FileCommandContext,
): Promise<void> {
  const files = getFilesInFolder(folderNode);
  
  if (files.length === 0) {
    context.toast.warning("No files in folder");
    return;
  }

  console.log(`Unstaging ${files.length} files in folder: ${folderNode.path}`);
  
  // Unstage each file with error handling
  let successCount = 0;
  let errorCount = 0;
  
  for (const filepath of files) {
    try {
      await context.gitService.unstageFile(filepath);
      successCount++;
    } catch (error) {
      console.error(`Failed to unstage ${filepath}:`, error);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    context.toast.warning(`Unstaged ${successCount} file${successCount !== 1 ? "s" : ""}, ${errorCount} failed`);
  } else {
    context.toast.info(`Unstaged ${successCount} file${successCount !== 1 ? "s" : ""} in ${folderNode.name}`);
  }
  
  await context.refetch();
}
