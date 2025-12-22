import type { TagCommandContext } from "./types.js";
import { handleAsyncOperation } from "../utils/error-handler.js";
import { InputModal } from "../components/modals/input-modal.js";

/**
 * Validate a tag name according to git tag naming rules
 * @param value - The tag name to validate
 * @param existingTags - Array of existing tag names to check against
 * @returns Error message if invalid, null if valid
 */
export function validateTagName(value: string, existingTags: string[] = []): string | null {
  const tagName = value;
  
  if (!tagName.trim()) {
    return "Tag name cannot be empty";
  }
  if (tagName.includes(" ")) {
    return "Tag name cannot contain spaces";
  }
  if (tagName.startsWith("-")) {
    return "Tag name cannot start with '-'";
  }
  if (tagName.includes("..")) {
    return "Tag name cannot contain '..'";
  }
  if (/[~^:?*[\\]/.test(tagName)) {
    return "Tag name contains invalid characters (:, ^, ~, ?, *, [, \\)";
  }
  if (tagName.endsWith(".lock")) {
    return "Tag name cannot end with '.lock'";
  }
  if (existingTags.includes(tagName)) {
    return `Tag '${tagName}' already exists`;
  }
  
  return null;
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
    await context.refetchTags();
  }
}

/**
 * Show dialog to create a new tag
 * @param currentBranch - Current branch name
 * @param commitHash - Current commit hash (short format)
 * @param context - Command context
 */
export async function showTagDialog(
  currentBranch: string,
  commitHash: string,
  context: TagCommandContext,
): Promise<void> {
  console.log("Opening tag dialog");

  // Fetch existing tags for validation
  let existingTags: string[] = [];
  try {
    existingTags = await context.gitService.getTags();
  } catch (error) {
    console.error("Failed to fetch existing tags:", error);
    // Continue with empty array - validation will still work for other rules
  }

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
        validate: (value: string) => validateTagName(value, existingTags),
      });
      return modal;
    },
    () => console.log("Tag dialog closed"),
  );
}
