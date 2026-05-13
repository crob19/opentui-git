import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/**/*.graphql",
  generates: {
    "src/resolvers-types.generated.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        contextType: "./infra/context.js#Context",
        mappers: {
          RepoStatus: "./git/types.js#GitStatusSummary",
          FileStatus: "./git/types.js#GitFileStatus",
          Branches: "./git/types.js#GitBranchInfo",
          Commit: "./git/types.js#GitCommitInfo",
        },
      },
    },
  },
};

export default config;
