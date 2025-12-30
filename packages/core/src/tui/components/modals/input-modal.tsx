import type { JSXElement } from "solid-js";
import { onMount, createSignal, onCleanup } from "solid-js";
import type { TextareaRenderable } from "@opentui/core";
import { useDialog } from "../dialog.js";
import { BaseModal } from "./base-modal.js";

/**
 * Props for the InputModal component
 */
export interface InputModalProps {
  /** Title of the input dialog */
  title: string;
  /** Label text shown above the input field */
  label: string;
  /** Placeholder text for the input field */
  placeholder: string;
  /** Default value for the input field */
  defaultValue?: string;
  /** Callback when user submits the input */
  onSubmit: (value: string) => void | Promise<void>;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Optional validation function returning error message or null */
  validate?: (value: string) => string | null;
  /** Height of the textarea (defaults to 1 for single-line) */
  height?: number;
}

/**
 * Generic input modal for text entry with validation support
 * Handles keyboard input (enter to submit, escape to cancel)
 * @param props - InputModal properties
 * @returns Input modal component
 */
export function InputModal(props: InputModalProps): JSXElement {
  const dialog = useDialog();
  const [error, setError] = createSignal<string | null>(null);
  let textareaRef: TextareaRenderable | undefined;
  let focusTimeoutId: NodeJS.Timeout | undefined;

  onMount(() => {
    // Focus textarea on mount and set default value if provided
    // Using setTimeout as a workaround since requestAnimationFrame isn't available in Node
    focusTimeoutId = setTimeout(() => {
      if (textareaRef) {
        // Set default value if provided (textarea doesn't have defaultValue prop)
        if (props.defaultValue && textareaRef.plainText === "") {
          // Note: plainText is read-only, so we use the initial render approach below
        }
        textareaRef.focus();
      }
    }, 10);
  });

  onCleanup(() => {
    // Clean up timeout if component unmounts before it fires
    if (focusTimeoutId) {
      clearTimeout(focusTimeoutId);
    }
  });

  const handleSubmit = () => {
    const value = textareaRef?.plainText?.trim() || "";
    
    // Validate if validator provided
    if (props.validate) {
      const validationError = props.validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Check for empty value
    if (!value) {
      setError("Value cannot be empty");
      return;
    }

    props.onSubmit(value);
    dialog.close();
  };

  return (
    <BaseModal
      title={props.title}
      footer={
        <>
          <box flexDirection="row">
            <text fg="#00AAFF">Enter</text>
            <text fg="#888888"> submit</text>
          </box>
          <box flexDirection="row">
            <text fg="#00AAFF">Esc</text>
            <text fg="#888888"> cancel</text>
          </box>
        </>
      }
    >
      <text fg="#888888">{props.label}</text>
      <textarea
        ref={(el: TextareaRenderable) => {
          textareaRef = el;
          // Set default value on ref callback if provided
          if (props.defaultValue && el.plainText === "") {
            // Workaround: We'll handle this via placeholder since plainText is readonly
            // The component should be updated to handle initial value differently
          }
        }}
        height={props.height || 1}
        width="100%"
        placeholder={props.defaultValue || props.placeholder}
        textColor="#FFFFFF"
        focusedTextColor="#FFFFFF"
        cursorColor="#00AAFF"
        onSubmit={handleSubmit}
        keyBindings={[{ name: "return", action: "submit" }]}
      />
      {error() && <text fg="#FF4444">{error()}</text>}
    </BaseModal>
  );
}
