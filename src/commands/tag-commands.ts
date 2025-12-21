import type { CommandContext } from "./types.js";
import { handleAsyncOperation } from "../utils/error-handler.js";
import { InputModal } from "../components/modals/input-modal.js";

/**
 * Context for tag-related commands
 */
export interface TagCommandContext extends CommandContext {
  /** Function to refetch git status */
  refetch: () => Promise<unknown>;
}

/**
 * Create a lightweight tag at HEAD
 * @param tagName - Name of the tag to create
 * @param context - Command context with git service, toast, and refetch functions
 */
export async function createTag(
  tagName: string,
  context: TagCommandContext,
): Promise<void> {
  console.log(`Creating tag: ${tagName}`);

  const result = await handleAsyncOperation(
    () => context.gitService.createTag(tagName),
    {
      toast: context.toast,
      setErrorMessage: context.setErrorMessage,
      operation: "Create tag",
    },
  );

  if (result !== null) {
    console.log(`Tag created: ${tagName}`);
    context.toast.success(`Created tag: ${tagName}`);
    await context.refetch();
  }
}

/**
 * Show dialog to create a new tag
 * @param currentBranch - Current branch name
 * @param commitHash - Current commit hash (short format)
 * @param context - Command context
 */
export function showTagDialog(
  currentBranch: string,
  commitHash: string,
  context: TagCommandContext,
): void {
  console.log("Opening tag dialog");

  context.dialog.show(
    () => {
      const modal = InputModal({
        title: "Create New Tag",
        label: `Branch: ${currentBranch} | Commit: ${commitHash}`,
        placeholder: "v1.0.0",
        onSubmit: async (tagName: string) => {
          await createTag(tagName, context);
        },
        onCancel: () => {
          console.log("Tag creation cancelled");
        },
        validate: (value: string) => {
          if (!value.trim()) {
            return "Tag name cannot be empty";
          }
          if (value.includes(" ")) {
            return "Tag name cannot contain spaces";
          }
          return null;
        },
      });
      return modal;
    },
    () => console.log("Tag dialog closed"),
  );
}
