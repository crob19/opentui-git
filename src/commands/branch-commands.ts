import type { Setter } from "solid-js";
import type { BranchCommandContext, BranchCommandWithSelectionContext } from "./types.js";
import { handleAsyncOperation } from "../utils/error-handler.js";
import { InputModal } from "../components/modals/input-modal.js";
import { ConfirmationModal } from "../components/modals/confirmation-modal.js";

/**
 * Checkout (switch to) a different branch
 * @param branchName - Name of the branch to checkout
 * @param context - Command context with git service, toast, and refetch functions
 */
export async function checkoutBranch(
  branchName: string,
  context: BranchCommandContext,
): Promise<void> {
  console.log(`Checking out branch: ${branchName}`);
  context.toast.info(`Switching to ${branchName}...`);

  const result = await handleAsyncOperation(
    () => context.gitService.checkoutBranch(branchName),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Checkout branch",
    },
  );

  if (result !== null) {
    console.log(`Switched to branch: ${branchName}`);
    context.toast.success(`Switched to branch: ${branchName}`);
    await context.refetch();
    await context.refetchBranches();
  }
}

/**
 * Create a new branch and switch to it
 * @param branchName - Name of the new branch to create
 * @param context - Command context with git service, toast, and refetch functions
 */
export async function createBranch(
  branchName: string,
  context: BranchCommandContext,
): Promise<void> {
  console.log(`Creating branch: ${branchName}`);

  const result = await handleAsyncOperation(
    () => context.gitService.createBranch(branchName),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Create branch",
    },
  );

  if (result !== null) {
    console.log(`Branch created and checked out: ${branchName}`);
    context.toast.success(`Switched to new branch: ${branchName}`);
    await context.refetch();
    await context.refetchBranches();
  }
}

/**
 * Delete a local branch
 * @param branchName - Name of the branch to delete
 * @param context - Command context with git service, toast, and refetch functions
 */
export async function deleteBranch(
  branchName: string,
  context: BranchCommandContext,
): Promise<void> {
  console.log(`Deleting branch: ${branchName}`);

  const result = await handleAsyncOperation(
    () => context.gitService.deleteBranch(branchName),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Delete branch",
    },
  );

  if (result !== null) {
    console.log(`Branch deleted: ${branchName}`);
    context.toast.success(`Deleted branch: ${branchName}`);
    await context.refetchBranches();
  }
}

/**
 * Merge a branch into the current branch
 * @param sourceBranch - Branch to merge from
 * @param targetBranch - Current branch (merge destination)
 * @param context - Command context with git service, toast, and refetch functions
 */
export async function mergeBranch(
  sourceBranch: string,
  targetBranch: string,
  context: BranchCommandContext,
): Promise<void> {
  console.log(`Merging branch: ${sourceBranch} into ${targetBranch}`);

  const result = await handleAsyncOperation(
    () => context.gitService.mergeBranch(sourceBranch),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Merge branch",
    },
  );

  if (result !== null) {
    console.log(`Merge result:`, result);

    if (result.files.length === 0 && result.merges.length === 0) {
      context.toast.info("Already up to date");
    } else {
      context.toast.success(`Merged ${sourceBranch} into ${targetBranch}`);
    }
    await context.refetch();
    await context.refetchBranches();
  }
}

/**
 * Show dialog for creating a new branch
 * @param currentBranch - Name of the current branch
 * @param shouldSelectNewBranch - Whether to select the new branch in the UI after creation
 * @param context - Command context with dialog and branch creation logic
 */
export function showNewBranchDialog(
  currentBranch: string,
  shouldSelectNewBranch: boolean,
  context: BranchCommandContext & { setBranchSelectedIndex?: Setter<number> },
): void {
  console.log("Opening new branch dialog");

  context.dialog.show(
    () => {
      const modal = InputModal({
        title: "Create New Branch",
        label: `Create from: ${currentBranch}`,
        placeholder: "Enter branch name...",
        onSubmit: async (branchName: string) => {
          await createBranch(branchName, context);
          // After creating and checking out the new branch from the branches panel,
          // it will be sorted to the top of the branch list; select it explicitly.
          if (shouldSelectNewBranch && context.setBranchSelectedIndex) {
            context.setBranchSelectedIndex(0);
          }
        },
        onCancel: () => {
          console.log("Branch creation cancelled");
        },
        validate: (value: string) => {
          if (!value.trim()) {
            return "Branch name cannot be empty";
          }
          if (value.includes(" ")) {
            return "Branch name cannot contain spaces";
          }
          return null;
        },
      });
      return modal;
    },
    () => console.log("Branch dialog closed"),
  );
}

/**
 * Show confirmation dialog for deleting a branch
 * @param branchName - Name of the branch to delete
 * @param currentBranch - Name of the current branch (to prevent deletion)
 * @param context - Command context with dialog, deletion logic, and selection management
 */
export function showDeleteBranchDialog(
  branchName: string,
  currentBranch: string,
  context: BranchCommandWithSelectionContext,
): void {
  if (branchName === currentBranch) {
    context.toast.warning("Cannot delete the current branch");
    return;
  }

  console.log(`Opening delete confirmation for branch: ${branchName}`);

  context.dialog.show(
    () => ConfirmationModal({
      title: "Delete Branch",
      message: `Are you sure you want to delete branch: ${branchName}?`,
      variant: "danger",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        await deleteBranch(branchName, context);
        await context.refetchBranches();
        // Reset selection index to the first branch after refetch
        context.setBranchSelectedIndex(0);
      },
      onCancel: () => {
        console.log("Branch deletion cancelled");
      },
    }),
    () => console.log("Delete branch dialog closed"),
  );
}

/**
 * Show confirmation dialog for merging a branch
 * @param sourceBranch - Branch to merge from
 * @param targetBranch - Current branch (merge destination)
 * @param context - Command context with dialog and merge logic
 */
export function showMergeBranchDialog(
  sourceBranch: string,
  targetBranch: string,
  context: BranchCommandContext,
): void {
  if (sourceBranch === targetBranch) {
    context.toast.warning("Cannot merge a branch into itself");
    return;
  }

  console.log(
    `Opening merge confirmation for branch: ${sourceBranch} into ${targetBranch}`,
  );

  context.dialog.show(
    () => ConfirmationModal({
      title: "Merge Branch",
      message: `Merge ${sourceBranch} into ${targetBranch}? This will merge the changes into your current branch.`,
      variant: "warning",
      confirmText: "Merge",
      cancelText: "Cancel",
      onConfirm: async () => {
        await mergeBranch(sourceBranch, targetBranch, context);
      },
      onCancel: () => {
        console.log("Branch merge cancelled");
      },
    }),
    () => console.log("Merge branch dialog closed"),
  );
}
