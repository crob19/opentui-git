import { useQuery } from "@apollo/client/react/index.js";
import { useEffect, useMemo } from "react";
import { FileTree, useFileTree } from "@pierre/trees/react";
import { RepoPathsDocument, StatusDocument } from "@opentui-git/client";
import { useSelection } from "../state/selection.js";
import { toGitStatusEntries } from "../lib/gitStatusAdapter.js";
import { useLatestCallback } from "../lib/useLatestCallback.js";

export function RepoTree() {
  const { openTab } = useSelection();

  const { data, loading, error } = useQuery(RepoPathsDocument);
  const statusQuery = useQuery(StatusDocument);

  const paths = useMemo(() => data?.repoPaths ?? [], [data]);
  const gitStatus = useMemo(
    () => toGitStatusEntries(statusQuery.data?.status.files ?? []),
    [statusQuery.data],
  );

  const onSelectionChange = useLatestCallback((selected: readonly string[]) => {
    const path = selected[0];
    if (!path) return;
    openTab({ path, kind: "view" });
  });

  const { model } = useFileTree({
    paths,
    gitStatus,
    flattenEmptyDirectories: false,
    search: true,
    onSelectionChange,
  });

  useEffect(() => {
    model.resetPaths(paths);
  }, [model, paths]);

  useEffect(() => {
    model.setGitStatus(gitStatus);
  }, [model, gitStatus]);

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
  if (statusQuery.error) {
    return (
      <div className="px-2 py-1.5 text-xs italic text-muted-foreground/60">
        Git status unavailable: {statusQuery.error.message}
      </div>
    );
  }

  return <FileTree model={model} className="h-full" />;
}
