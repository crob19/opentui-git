import type { Resolvers } from "../../resolvers-types.generated.js";

export const repoResolvers: Resolvers = {
  Query: {
    repoInfo: async (_p, _a, { git }) => {
      const isRepo = await git.isRepo();
      const repoRoot = isRepo ? await git.getRepoRoot() : null;
      const remoteUrl = isRepo ? await git.getRemoteUrl() : null;
      return { isRepo, repoRoot, remoteUrl };
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
};
