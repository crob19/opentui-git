import {
  createContext,
  useContext,
  Show,
  type ParentProps,
  type JSX,
} from "solid-js";
import { createStore } from "solid-js/store";
import { useTerminalDimensions } from "@opentui/solid";

/**
 * Dialog context and provider - manages modal dialogs
 */

type DialogState = {
  content: (() => JSX.Element) | null;
  onClose?: () => void;
};

function createDialogContext() {
  const [state, setState] = createStore<DialogState>({
    content: null,
    onClose: undefined,
  });

  return {
    get isOpen() {
      return state.content !== null;
    },
    show(content: () => JSX.Element, onClose?: () => void) {
      setState({ content, onClose });
    },
    close() {
      state.onClose?.();
      setState({ content: null, onClose: undefined });
    },
    get content() {
      return state.content;
    },
    getState() {
      return state;
    },
    setState,
  };
}

export type DialogContext = ReturnType<typeof createDialogContext>;

const DialogCtx = createContext<DialogContext>();

export function useDialog() {
  const ctx = useContext(DialogCtx);
  if (!ctx) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return ctx;
}

export function DialogProvider(props: ParentProps) {
  const dialog = createDialogContext();
  const dimensions = useTerminalDimensions();

  return (
    <DialogCtx.Provider value={dialog}>
      {props.children}
      <Show when={dialog.isOpen}>
        <box
          position="absolute"
          left={0}
          top={0}
          width={dimensions().width}
          height={dimensions().height}
          backgroundColor="#000000"
          alignItems="center"
          justifyContent="center"
        >
          <box
            backgroundColor="#1a1a1a"
            borderStyle="single"
            borderColor="#00AAFF"
            width={60}
            maxWidth={dimensions().width - 4}
            flexDirection="column"
            padding={1}
          >
            {dialog.content?.()}
          </box>
        </box>
      </Show>
    </DialogCtx.Provider>
  );
}
