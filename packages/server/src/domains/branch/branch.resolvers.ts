import type { Resolvers } from "../../resolvers-types.generated.js";

export const branchResolvers: Resolvers = {
  Query: {
    branches: (_p, _a, { git }) => git.getBranches(),
    defaultBranch: (_p, _a, { git }) => git.getDefaultBranch(),
  },
  Mutation: {
    createBranch: async (_p, { name }, { git }) => {
      await git.createBranch(name);
      return { success: true, branch: name };
    },
    checkoutBranch: async (_p, { name }, { git }) => {
      await git.checkoutBranch(name);
      return { success: true, branch: name };
    },
    deleteBranch: async (_p, { name, force }, { git }) => {
      await git.deleteBranch(name, force ?? false);
      return { success: true, branch: name };
    },
    mergeBranch: async (_p, { name }, { git }) => {
      const result = await git.mergeBranch(name);
      return {
        success: true,
        merges: result.merges ?? [],
        conflicts: (result.conflicts ?? []).map((c) =>
          typeof c === "string" ? c : (c.file ?? "unknown"),
        ),
        result: result.result ?? "",
      };
    },
  },
};
