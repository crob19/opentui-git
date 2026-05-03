import type { Resolvers } from "../../resolvers-types.generated.js";

export const tagResolvers: Resolvers = {
  Query: {
    tags: (_p, _a, { git }) => git.getTags(),
  },
  Mutation: {
    createTag: async (_p, { name }, { git }) => {
      await git.createTag(name);
      return { success: true, tag: name };
    },
    pushTag: async (_p, { name, remote }, { git }) => {
      await git.pushTag(name, remote ?? "origin");
      return { success: true, tag: name };
    },
  },
};
