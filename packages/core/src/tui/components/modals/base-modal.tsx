import type { JSXElement } from "solid-js";

/**
 * Props for the BaseModal component
 */
export interface BaseModalProps {
  /** Title text displayed at the top of the modal */
  title: string;
  /** Color for the title text (defaults to #00AAFF) */
  titleColor?: string;
  /** Main content of the modal */
  children: JSXElement;
  /** Optional footer content (keyboard shortcuts, action buttons, etc.) */
  footer?: JSXElement;
}

/**
 * Base modal component providing consistent structure for all dialogs
 * @param props - BaseModal properties
 * @returns Modal component with title, content, and optional footer
 */
export function BaseModal(props: BaseModalProps): JSXElement {
  return (
    <box flexDirection="column" gap={1}>
      <text fg={props.titleColor || "#00AAFF"}>{props.title}</text>
      
      <box flexDirection="column" gap={0}>
        {props.children}
      </box>
      
      {props.footer && (
        <box flexDirection="row" gap={2}>
          {props.footer}
        </box>
      )}
    </box>
  );
}
