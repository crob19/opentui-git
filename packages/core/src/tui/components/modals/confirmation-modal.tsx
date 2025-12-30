import type { JSXElement } from "solid-js";
import { useKeyboard } from "@opentui/solid";
import { useDialog } from "../dialog.js";
import { BaseModal } from "./base-modal.js";

/**
 * Variant types for confirmation modals affecting color scheme
 */
export type ConfirmationVariant = "danger" | "warning" | "info";

/**
 * Props for the ConfirmationModal component
 */
export interface ConfirmationModalProps {
  /** Title of the confirmation dialog */
  title: string;
  /** Message content (can be string or JSX) */
  message: string | JSXElement;
  /** Text for confirm button (defaults to "Yes") */
  confirmText?: string;
  /** Text for cancel button (defaults to "No") */
  cancelText?: string;
  /** Callback when user confirms */
  onConfirm: () => void | Promise<void>;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Visual variant affecting colors (defaults to "info") */
  variant?: ConfirmationVariant;
}

/**
 * Color schemes for different confirmation variants
 */
const VARIANT_COLORS = {
  danger: {
    title: "#FF4444",
    confirm: "#44FF44",
    cancel: "#FF4444",
  },
  warning: {
    title: "#FFAA00",
    confirm: "#44FF44",
    cancel: "#FF4444",
  },
  info: {
    title: "#00AAFF",
    confirm: "#00AAFF",
    cancel: "#888888",
  },
};

/**
 * Generic confirmation modal for yes/no decisions
 * Handles keyboard input (y/n/escape) and provides consistent UI
 * @param props - ConfirmationModal properties
 * @returns Confirmation modal component
 */
export function ConfirmationModal(props: ConfirmationModalProps): JSXElement {
  const dialog = useDialog();
  const variant = props.variant || "info";
  const colors = VARIANT_COLORS[variant];
  const confirmText = props.confirmText || "Yes";
  const cancelText = props.cancelText || "No";

  useKeyboard((event) => {
    if (!dialog.isOpen) return;

    switch (event.name) {
      case "y":
        props.onConfirm();
        dialog.close();
        event.preventDefault();
        break;
      case "n":
      case "escape":
        props.onCancel();
        dialog.close();
        event.preventDefault();
        break;
    }
  });

  return (
    <BaseModal
      title={props.title}
      titleColor={colors.title}
      footer={
        <>
          <box flexDirection="row">
            <text fg={colors.confirm}>y</text>
            <text fg="#888888"> {confirmText.toLowerCase()}</text>
          </box>
          <box flexDirection="row">
            <text fg={colors.cancel}>n</text>
            <text fg="#888888"> {cancelText.toLowerCase()}</text>
          </box>
        </>
      }
    >
      {typeof props.message === "string" ? (
        <text fg="#FFFFFF">{props.message}</text>
      ) : (
        props.message
      )}
    </BaseModal>
  );
}
