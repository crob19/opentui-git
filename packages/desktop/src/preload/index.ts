// Intentionally minimal: the renderer talks to the GraphQL server over HTTP,
// so no IPC bridge is needed yet. Add contextBridge.exposeInMainWorld here
// when the renderer needs privileged operations (file picker, shell, etc.).
export {};
