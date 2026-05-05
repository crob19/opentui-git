import simpleGit from "simple-git";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

import { schema } from "./schema/index.js";
import { buildContext, type Context } from "./infra/context.js";

const cwdArgIndex = process.argv.indexOf("--cwd");
const startCwd =
  cwdArgIndex >= 0 && process.argv[cwdArgIndex + 1]
    ? process.argv[cwdArgIndex + 1]
    : process.cwd();

// Resolve the repo toplevel so paths from `git status` (always repo-root-
// relative) line up with the cwd subsequent `git diff <path>` calls run from.
// Without this, launching the TUI from a subdir (e.g. `bun run --cwd
// packages/core …`) breaks diff lookups for files outside that subdir.
let cwd = startCwd;
try {
  cwd = (await simpleGit(startCwd).revparse(["--show-toplevel"])).trim();
} catch {
  // Not in a git repo — fall back to the provided cwd; resolvers handle this.
}

const portEnv = process.env.PORT;
const port = portEnv ? Number(portEnv) : 4000;

const server = new ApolloServer<Context>({ schema });

const { url } = await startStandaloneServer(server, {
  listen: { port, host: "127.0.0.1" },
  context: async () => buildContext(cwd),
});

// Emit a structured line so a parent process (e.g. the TUI) can capture
// the chosen URL when it spawns this binary on port 0.
console.log(JSON.stringify({ type: "ready", url, cwd }));
