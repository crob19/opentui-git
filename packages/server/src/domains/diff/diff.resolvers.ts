import type { Resolvers } from "../../resolvers-types.generated.js";

export const diffResolvers: Resolvers = {
  Query: {
    diff: (_p, { path, options }, { git }) => {
      if (options?.branch) {
        return git.getDiffAgainstBranch(path, options.branch);
      }
      return git.getDiff(path, options?.staged ?? false);
    },
    filesChangedAgainstBranch: (_p, { branch }, { git }) =>
      git.getFilesChangedAgainstBranch(branch),
  },
};
