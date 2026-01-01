import { createEffect, onCleanup, Show, type JSX, type ParentComponent } from "solid-js";
import { Portal } from "solid-js/web";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: JSX.Element;
}

/**
 * Reusable modal component with backdrop blur
 */
export const Modal: ParentComponent<ModalProps> = (props) => {
  // Handle ESC key to close
  createEffect(() => {
    if (props.open) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          props.onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      onCleanup(() => window.removeEventListener("keydown", handleKeyDown));
    }
  });

  // Prevent scroll when modal is open
  createEffect(() => {
    if (props.open) {
      document.body.style.overflow = "hidden";
      onCleanup(() => {
        document.body.style.overflow = "";
      });
    }
  });

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
          style={{ "backdrop-filter": "blur(4px)" }}
          onClick={handleBackdropClick}
        >
          <div
            class="bg-app-surface border border-app-border rounded-lg shadow-2xl max-w-lg w-full mx-4"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <Show when={props.title}>
              <div class="px-6 py-4 border-b border-app-border">
                <h2 class="text-lg font-semibold text-app-text">{props.title}</h2>
              </div>
            </Show>

            {/* Content */}
            <div class="px-6 py-4">
              {props.children}
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
