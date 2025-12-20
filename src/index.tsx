import { render } from "@opentui/solid";
import { App } from "./app.js";

/**
 * Entry point for opentui-git
 * Initializes the OpenTUI renderer and starts the application
 */

// Handle graceful shutdown
process.on("SIGINT", () => {
  process.exit(0);
});

process.on("SIGTERM", () => {
  process.exit(0);
});

// Render the app
render(() => <App />);
