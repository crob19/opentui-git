import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Renderer crashed:", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={styles.wrap}>
        <h1 style={styles.title}>Something went wrong</h1>
        <pre style={styles.pre}>{this.state.error.message}</pre>
        {this.state.error.stack && (
          <pre style={styles.stack}>{this.state.error.stack}</pre>
        )}
        <button style={styles.btn} onClick={this.reset}>
          Try again
        </button>
      </div>
    );
  }
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: 24,
    background: "#1a1a1a",
    color: "#e6e6e6",
    minHeight: "100vh",
    fontFamily:
      "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  title: { margin: "0 0 12px", fontSize: 18, color: "#ff6b6b" },
  pre: {
    background: "#0e0e0e",
    border: "1px solid #2a2a2a",
    padding: 12,
    borderRadius: 4,
    fontFamily: "ui-monospace, monospace",
    fontSize: 13,
    whiteSpace: "pre-wrap",
    color: "#ff9b9b",
  },
  stack: {
    background: "#0e0e0e",
    border: "1px solid #2a2a2a",
    padding: 12,
    borderRadius: 4,
    fontFamily: "ui-monospace, monospace",
    fontSize: 11,
    color: "#888",
    maxHeight: 320,
    overflow: "auto",
    marginTop: 12,
  },
  btn: {
    marginTop: 16,
    background: "#2d6cdf",
    border: "none",
    color: "#fff",
    padding: "8px 18px",
    borderRadius: 4,
    fontSize: 13,
    cursor: "pointer",
  },
};
