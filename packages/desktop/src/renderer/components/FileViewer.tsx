import { useQuery } from "@apollo/client/react/index.js";
import { useEffect, useState } from "react";
import { ReadFileDocument } from "@opentui-git/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SelectionTab } from "../state/selection.js";
import { highlight } from "../lib/highlighter.js";

const MAX_CHARS = 1024 * 1024;

export function FileViewer({ tab }: { tab: SelectionTab }) {
  const { data, loading, error } = useQuery(ReadFileDocument, {
    variables: { path: tab.path },
  });

  const content = data?.readFile?.content ?? "";
  const tooLarge = content.length > MAX_CHARS;
  const binary = !tooLarge && containsBinary(content);
  const renderable = !!data && !tooLarge && !binary;

  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!renderable) {
      setHtml(null);
      return;
    }
    let cancelled = false;
    highlight(tab.path, content)
      .then((out) => {
        if (!cancelled) setHtml(out);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [content, renderable, tab.path]);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 min-h-0 overflow-auto">
        <pre className="p-4 text-destructive whitespace-pre-wrap font-mono text-sm">
          {error.message}
        </pre>
      </div>
    );
  }

  if (tooLarge) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
        File is too large to preview (
        {(content.length / 1024 / 1024).toFixed(1)}M chars)
      </div>
    );
  }

  if (binary) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground/60 italic">
        Binary file — preview not available
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      {html ? (
        <div
          className="file-viewer text-sm"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="p-4 font-mono text-sm whitespace-pre">{content}</pre>
      )}
    </ScrollArea>
  );
}

function containsBinary(s: string): boolean {
  const sample = s.slice(0, 8192);
  return sample.indexOf("\0") !== -1;
}
