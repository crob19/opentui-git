import type {
  GitFileStatus,
  GitStatusSummary,
  GitCommitInfo,
} from "@opentui-git/core/git/types";
import type { Resolvers } from "../../resolvers-types.generated.js";

export const repoResolvers: Resolvers = {
  Query: {
    repoInfo: async (_p, _a, { git }) => {
      const isRepo = await git.isRepo();
      const repoRoot = isRepo ? await git.getRepoRoot() : null;
      return { isRepo, repoRoot };
    },
    status: (_p, _a, { git }) => git.getStatus(),
    commits: (_p, { limit }, { git }) => git.getCommits(limit ?? 50),
    currentCommitHash: (_p, _a, { git }) => git.getCurrentCommitHash(),
  },
  Mutation: {
    commit: async (_p, { message }, { git }) => {
      const hash = await git.commit(message);
      return { success: true, commit: hash };
    },
  },
  RepoStatus: {
    current: (s: GitStatusSummary) => s.current,
    ahead: (s: GitStatusSummary) => s.ahead,
    behind: (s: GitStatusSummary) => s.behind,
    files: (s: GitStatusSummary) => s.files,
    isClean: (s: GitStatusSummary) => s.isClean,
  },
  FileStatus: {
    path: (f: GitFileStatus) => f.path,
    workingDir: (f: GitFileStatus) => f.working_dir,
    index: (f: GitFileStatus) => f.index,
    staged: (f: GitFileStatus) => f.staged,
    statusText: (f: GitFileStatus) => f.statusText,
    color: (f: GitFileStatus) => f.color,
    hasLocalChanges: (f: GitFileStatus) => f.hasLocalChanges ?? null,
  },
  Commit: {
    hash: (c: GitCommitInfo) => c.hash,
    date: (c: GitCommitInfo) => c.date,
    message: (c: GitCommitInfo) => c.message,
    authorName: (c: GitCommitInfo) => c.author_name,
    authorEmail: (c: GitCommitInfo) => c.author_email,
  },
};
