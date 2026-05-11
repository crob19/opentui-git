import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";

import { WorkerPoolContextProvider } from "@pierre/diffs/react";
import { App } from "./App.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import { ProjectsProvider } from "./state/projects.js";
import { diffWorkerFactory } from "./lib/diff-worker.js";
import { ACTIVE_THEME } from "./lib/theme.js";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TooltipProvider>
        <WorkerPoolContextProvider
          poolOptions={{ workerFactory: diffWorkerFactory }}
          highlighterOptions={{ theme: ACTIVE_THEME.diff }}
        >
          <ProjectsProvider>
            <App />
          </ProjectsProvider>
        </WorkerPoolContextProvider>
        <Toaster richColors closeButton />
      </TooltipProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
