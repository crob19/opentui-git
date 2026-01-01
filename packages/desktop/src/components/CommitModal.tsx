import { createSignal, createEffect } from "solid-js";
import { Modal } from "./Modal.js";

export interface CommitModalProps {
  open: boolean;
  onClose: () => void;
  onCommit: (message: string) => Promise<void>;
  stagedCount: number;
}

/**
 * CommitModal - Modal dialog for entering commit message
 */
export function CommitModal(props: CommitModalProps) {
  const [message, setMessage] = createSignal("");
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  let textareaRef: HTMLTextAreaElement | undefined;

  // Auto-focus textarea when modal opens
  createEffect(() => {
    if (props.open && textareaRef) {
      setTimeout(() => {
        textareaRef?.focus();
      }, 100);
    }
  });

  // Reset message when modal closes
  createEffect(() => {
    if (!props.open) {
      setMessage("");
      setIsSubmitting(false);
    }
  });

  const handleSubmit = async () => {
    const msg = message().trim();
    console.log("[CommitModal] handleSubmit called, message:", msg, "isSubmitting:", isSubmitting());
    if (!msg || isSubmitting()) return;

    setIsSubmitting(true);
    try {
      console.log("[CommitModal] Calling onCommit");
      await props.onCommit(msg);
      console.log("[CommitModal] onCommit completed, closing modal");
      props.onClose();
    } catch (error) {
      console.error("[CommitModal] onCommit failed:", error);
      // Error handling is done in parent component
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to submit
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
    // Allow plain Enter for newlines in the textarea (default behavior)
  };

  const isValid = () => message().trim().length > 0;

  return (
    <Modal open={props.open} onClose={props.onClose} title="Commit Changes">
      <div class="flex flex-col gap-4">
        {/* Staged files count */}
        <div class="text-sm text-app-text-muted">
          Committing <span class="text-app-accent font-medium">{props.stagedCount}</span> staged file{props.stagedCount !== 1 ? "s" : ""}
        </div>

        {/* Commit message textarea */}
        <div class="flex flex-col gap-2">
          <label for="commit-message" class="text-sm font-medium text-app-text">
            Commit Message
          </label>
          <textarea
            ref={textareaRef}
            id="commit-message"
            value={message()}
            onInput={(e) => setMessage(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter commit message..."
            class="
              w-full px-3 py-2 rounded border border-app-border bg-app-bg text-app-text
              focus:outline-none focus:border-app-accent focus:ring-1 focus:ring-app-accent
              resize-none font-mono text-sm
              min-h-[100px]
            "
            disabled={isSubmitting()}
          />
          <div class="text-xs text-app-text-muted">
            Press <kbd class="px-1 py-0.5 rounded bg-app-border text-app-text">Ctrl+Enter</kbd> (or <kbd class="px-1 py-0.5 rounded bg-app-border text-app-text">Cmd+Enter</kbd>) to commit
          </div>
        </div>

        {/* Action buttons */}
        <div class="flex justify-end gap-3 pt-2">
          <button
            onClick={() => {
              console.log("[CommitModal] Cancel button clicked");
              props.onClose();
            }}
            disabled={isSubmitting()}
            class="
              px-4 py-2 rounded border border-app-border text-app-text
              hover:bg-white/5 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid() || isSubmitting()}
            class="
              px-4 py-2 rounded bg-app-accent text-white font-medium
              hover:bg-app-accent/80 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isSubmitting() ? "Committing..." : "Commit"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
