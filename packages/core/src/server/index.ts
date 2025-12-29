import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { GitService } from "../git/index.js";

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

  const app = new Elysia()
    .use(cors())
    .get("/health", () => ({ status: "ok" }))
    
    // Status routes
    .get("/status", async () => {
      const status = await git.getStatus();
      return status;
    })
    .get("/status/repo", async () => {
      const isRepo = await git.isRepo();
      const repoRoot = isRepo ? await git.getRepoRoot() : null;
      return { isRepo, repoRoot };
    })
    
    // Branch routes
    .get("/branches", async () => {
      return await git.getBranches();
    })
    .get("/branches/default", async () => {
      const defaultBranch = await git.getDefaultBranch();
      return { defaultBranch };
    })
    .post("/branches", async ({ body }) => {
      const { name } = body as { name: string };
      await git.createBranch(name);
      return { success: true, branch: name };
    })
    .post("/branches/:name/checkout", async ({ params }) => {
      await git.checkoutBranch(params.name);
      return { success: true };
    })
    .post("/branches/:name/merge", async ({ params }) => {
      const result = await git.mergeBranch(params.name);
      return { success: true, result };
    })
    .delete("/branches/:name", async ({ params, query }) => {
      const force = query.force === "true";
      await git.deleteBranch(params.name, force);
      return { success: true };
    })
    
    // Tag routes
    .get("/tags", async () => {
      const tags = await git.getTags();
      return { tags };
    })
    .post("/tags", async ({ body }) => {
      const { name } = body as { name: string };
      await git.createTag(name);
      return { success: true, tag: name };
    })
    .post("/tags/:name/push", async ({ params, body }) => {
      const remote = (body as { remote?: string })?.remote || "origin";
      await git.pushTag(params.name, remote);
      return { success: true };
    })
    
    // File routes
    .post("/files/stage", async ({ body }) => {
      const { path } = body as { path: string };
      await git.stageFile(path);
      return { success: true };
    })
    .post("/files/unstage", async ({ body }) => {
      const { path } = body as { path: string };
      await git.unstageFile(path);
      return { success: true };
    })
    .post("/files/stage-all", async () => {
      await git.stageAll();
      return { success: true };
    })
    .post("/files/unstage-all", async () => {
      await git.unstageAll();
      return { success: true };
    })
    .get("/files/read", async ({ query }) => {
      const result = await git.readFileWithMetadata(query.path!);
      return result;
    })
    .post("/files/write", async ({ body }) => {
      const { path, content, expectedMtime } = body as { path: string; content: string; expectedMtime?: string };
      const mtime = expectedMtime ? new Date(expectedMtime) : undefined;
      const result = await git.writeFileWithCheck(path, content, mtime);
      return result;
    })
    
    // Commit routes
    .get("/commits", async ({ query }) => {
      const limit = query.limit ? parseInt(query.limit, 10) : 50;
      const commits = await git.getCommits(limit);
      return { commits };
    })
    .get("/commits/current", async () => {
      const hash = await git.getCurrentCommitHash();
      return { hash };
    })
    .post("/commits", async ({ body }) => {
      const { message } = body as { message: string };
      const hash = await git.commit(message);
      return { success: true, hash };
    })
    
    // Diff routes
    .get("/diff", async ({ query }) => {
      const { path, staged, branch } = query;
      
      if (branch) {
        const diff = await git.getDiffAgainstBranch(path!, branch);
        return { diff };
      } else {
        const isStaged = staged === "true";
        const diff = await git.getDiff(path!, isStaged);
        return { diff };
      }
    })
    .get("/diff/files", async ({ query }) => {
      const files = await git.getFilesChangedAgainstBranch(query.branch!);
      return { files };
    })
    
    // Remote routes
    .post("/remote/pull", async () => {
      await git.pull();
      return { success: true };
    })
    .post("/remote/push", async () => {
      await git.push();
      return { success: true };
    })
    
    // SSE events endpoint
    .get("/events", async function* () {
      // Send initial connected event
      yield { data: JSON.stringify({ type: "connected", timestamp: Date.now() }) };
      
      // Keep-alive with heartbeat
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 30000));
        yield { data: JSON.stringify({ type: "heartbeat", timestamp: Date.now() }) };
      }
    });

  return app;
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

// Auto-start when run directly
if (import.meta.main) {
  const port = parseInt(process.env.PORT || "4096", 10);
  startServer({ port });
}
