import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { GitService } from "../git/index.js";
import { statusRoutes } from "./routes/status.js";
import { branchRoutes } from "./routes/branches.js";
import { tagRoutes } from "./routes/tags.js";
import { fileRoutes } from "./routes/files.js";
import { commitRoutes } from "./routes/commits.js";
import { diffRoutes } from "./routes/diff.js";
import { remoteRoutes } from "./routes/remote.js";
import { eventRoutes } from "./routes/events.js";

export interface ServerOptions {
  port?: number;
  hostname?: string;
  repoPath?: string;
}

/**
 * Create the Elysia app with all routes
 */
export function createApp(repoPath: string = process.cwd()) {
  const git = new GitService(repoPath);

  return new Elysia()
    .use(cors())
    .decorate("git", git)
    .get("/health", () => ({ status: "ok" }))
    .use(statusRoutes)
    .use(branchRoutes)
    .use(tagRoutes)
    .use(fileRoutes)
    .use(commitRoutes)
    .use(diffRoutes)
    .use(remoteRoutes)
    .use(eventRoutes);
}

// Export the app type for Eden client
export type App = ReturnType<typeof createApp>;

/**
 * Start the server
 */
export async function startServer(options: ServerOptions = {}) {
  const { port = 4096, hostname = "localhost", repoPath = process.cwd() } = options;
  
  const app = createApp(repoPath);
  
  app.listen({ port, hostname });
  
  console.log(`Server running at http://${hostname}:${port}`);
  console.log(`Repository: ${repoPath}`);
  
  return app;
}
