import React from "react";
import ReactDOM from "react-dom/client";
import { ApolloProvider } from "@apollo/client/react/index.js";
import { createClient } from "@opentui-git/client";

import { App } from "./App.js";
import { ToastProvider } from "./components/Toast.js";
import { ModalProvider } from "./components/Modal.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";

// Endpoint comes from the Electron main process (which spawns the GraphQL
// server on a free port and forwards the URL through preload). Vite env and
// a hard-coded default are fallbacks for non-Electron contexts.
const endpoint =
  window.opentui?.endpoint ??
  import.meta.env.VITE_GRAPHQL_ENDPOINT ??
  "http://127.0.0.1:4000/";

const client = createClient({ endpoint, fetch: window.fetch.bind(window) });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ApolloProvider client={client}>
        <ToastProvider>
          <ModalProvider>
            <App />
          </ModalProvider>
        </ToastProvider>
      </ApolloProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
