import { contextBridge } from "electron";

const ENDPOINT_FLAG = "--opentui-endpoint=";
const endpointArg = process.argv.find((a) => a.startsWith(ENDPOINT_FLAG));
const endpoint = endpointArg ? endpointArg.slice(ENDPOINT_FLAG.length) : null;

contextBridge.exposeInMainWorld("opentui", { endpoint });
