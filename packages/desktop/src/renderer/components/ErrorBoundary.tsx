import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

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
      <div className="dark min-h-screen p-6 bg-background text-foreground">
        <h1 className="text-lg text-destructive font-semibold mb-3">
          Something went wrong
        </h1>
        <pre className="bg-muted/50 border border-border rounded p-3 font-mono text-sm whitespace-pre-wrap text-destructive">
          {this.state.error.message}
        </pre>
        {this.state.error.stack && (
          <pre className="mt-3 max-h-80 overflow-auto bg-muted/50 border border-border rounded p-3 font-mono text-[11px] text-muted-foreground">
            {this.state.error.stack}
          </pre>
        )}
        <Button className="mt-4" onClick={this.reset}>
          Try again
        </Button>
      </div>
    );
  }
}
