import type { Resolvers } from "../../resolvers-types.generated.js";

export const fileResolvers: Resolvers = {
  Query: {
    readFile: async (_p, { path }, { git }) => {
      const { content, mtime } = await git.readFileWithMetadata(path);
      return { content, mtime: mtime.toISOString() };
    },
    repoTree: async (_p, { path }, { git }) => {
      return git.listTree(path);
    },
  },
  Mutation: {
    writeFile: async (_p, { path, content, expectedMtime }, { git }) => {
      const expected = expectedMtime ? new Date(expectedMtime) : undefined;
      const result = await git.writeFileWithCheck(path, content, expected);
      return {
        success: result.success,
        conflict: !result.success,
        message: result.message ?? null,
      };
    },
    stageFile: async (_p, { path }, { git }) => {
      await git.stageFile(path);
      return { success: true };
    },
    unstageFile: async (_p, { path }, { git }) => {
      await git.unstageFile(path);
      return { success: true };
    },
    stageFiles: async (_p, { paths }, { git }) => {
      await git.stageFiles(paths);
      return { success: true };
    },
    unstageFiles: async (_p, { paths }, { git }) => {
      await git.unstageFiles(paths);
      return { success: true };
    },
    stageAll: async (_p, _a, { git }) => {
      await git.stageAll();
      return { success: true };
    },
    unstageAll: async (_p, _a, { git }) => {
      await git.unstageAll();
      return { success: true };
    },
  },
};
