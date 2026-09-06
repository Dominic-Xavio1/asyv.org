import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/esm-extension-hook.mjs", pathToFileURL("./"));

const { start } = await import("./server-main.js");
await start();
