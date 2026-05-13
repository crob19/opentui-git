import { useQuery } from "@apollo/client/react/index.js";
import { useEffect, useMemo, useRef } from "react";
import { FileTree, useFileTree } from "@pierre/trees/react";
import { RepoPathsDocument, StatusDocument } from "@opentui-git/client";
import { useSelection } from "../state/selection.js";
import { toGitStatusEntries } from "../lib/gitStatusAdapter.js";
import { usePinOnDoubleClick } from "../lib/usePinOnDoubleClick.js";

export function RepoTree() {
  const { openTab } = useSelection();

  const { data, loading, error } = useQuery(RepoPathsDocument);
  const statusQuery = useQuery(StatusDocument);

  const paths = useMemo(() => data?.repoPaths ?? [], [data]);
  const gitStatus = useMemo(
    () => toGitStatusEntries(statusQuery.data?.status.files ?? []),
    [statusQuery.data],
  );

  // pierre/trees' useFileTree captures onSelectionChange once at mount, so
  // openTab would be frozen to the first render. Reach through a ref each call.
  // Revisit if pierre/trees exposes a callback setter.
  const openTabRef = useRef(openTab);
  openTabRef.current = openTab;

  const { model } = useFileTree({
    paths,
    gitStatus,
    flattenEmptyDirectories: false,
    search: true,
    onSelectionChange: (selected) => {
      const path = selected[0];
      if (!path) return;
      openTabRef.current({ path, kind: "view" });
    },
  });

  useEffect(() => {
    model.resetPaths(paths);
  }, [model, paths]);

  useEffect(() => {
    model.setGitStatus(gitStatus);
  }, [model, gitStatus]);

  const containerRef = usePinOnDoubleClick((path) =>
    openTabRef.current({ path, kind: "view", pinned: true }),
  );

  if (loading && paths.length === 0) {
    return (
      <div className="px-2 py-1.5 text-xs italic text-muted-foreground/60">
        Loading…
      </div>
    );
  }
  if (error) {
    return (
      <div className="px-2 py-1.5 text-xs italic text-muted-foreground/60">
        {error.message}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full">
      <FileTree model={model} className="h-full" />
    </div>
  );
}
