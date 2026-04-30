import type { Resolvers } from "../../resolvers-types.generated.js";

export const remoteResolvers: Resolvers = {
  Mutation: {
    pull: async (_p, _a, { git }) => {
      await git.pull();
      return { success: true };
    },
    push: async (_p, _a, { git }) => {
      await git.push();
      return { success: true };
    },
  },
};
