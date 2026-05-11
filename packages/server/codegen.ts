import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "src/**/*.graphql",
  generates: {
    "src/resolvers-types.generated.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        useIndexSignature: true,
        contextType: "./infra/context#Context",
        // Map GraphQL types to internal model types where the resolver returns
        // the raw service shape rather than the schema shape.
        mappers: {
          RepoStatus: "./git/types#GitStatusSummary",
          FileStatus: "./git/types#GitFileStatus",
          Branches: "./git/types#GitBranchInfo",
          Commit: "./git/types#GitCommitInfo",
        },
      },
    },
  },
};

export default config;
