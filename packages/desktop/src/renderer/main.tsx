import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import { ApolloProvider } from "@apollo/client/react/index.js";
import { createClient } from "@opentui-git/client";

import { WorkerPoolContextProvider } from "@pierre/diffs/react";
import { App } from "./App.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { SelectionProvider } from "./state/selection.js";
import { diffWorkerFactory } from "./lib/diff-worker.js";
import { ACTIVE_THEME } from "./lib/theme.js";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Endpoint comes from the Electron main process (which spawns the GraphQL
// server on a free port and forwards the URL through preload). Vite env and
// a hard-coded default are fallbacks for non-Electron contexts.
const endpoint =
  window.opentui?.endpoint ??
  import.meta.env.VITE_GRAPHQL_ENDPOINT ??
  "http://127.0.0.1:4000/";

const client = createClient({ endpoint, fetch: window.fetch.bind(window) });

document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <TooltipProvider>
          <WorkerPoolContextProvider
            poolOptions={{ workerFactory: diffWorkerFactory }}
            highlighterOptions={{ theme: ACTIVE_THEME.diff }}
          >
            <SelectionProvider>
              <App />
            </SelectionProvider>
          </WorkerPoolContextProvider>
          <Toaster richColors closeButton />
        </TooltipProvider>
      </ApolloProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
