import type { Resolvers } from "../../resolvers-types.generated.js";

export const remoteResolvers: Resolvers = {
  Mutation: {
    pull: async (_p, _a, { git }) => {
      await git.pull();
      return { success: true };
    },
    push: async (_p, { force }, { git }) => {
      await git.push(force ?? false);
      return { success: true };
    },
    fetch: async (_p, _a, { git }) => {
      await git.fetch();
      return { success: true };
    },
  },
};
