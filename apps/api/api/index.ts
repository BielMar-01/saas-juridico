import type { IncomingMessage, ServerResponse } from "node:http";
import type { ApiEnv } from "../src/env/index.js";
import { parseServerEnv } from "../src/env/index.js";
import { getServerlessRuntime } from "../src/runtime.js";

type ServerlessApplication = { ready(): PromiseLike<unknown>; server: { emit(event: "request", request: IncomingMessage, response: ServerResponse): unknown } };
type RuntimeResolver = (env: ApiEnv) => Promise<{ app: ServerlessApplication }>;

export function createVercelHandler(resolveRuntime: RuntimeResolver = getServerlessRuntime, readEnv: () => ApiEnv = parseServerEnv) {
  return async function handler(request: IncomingMessage, response: ServerResponse) {
    const { app } = await resolveRuntime(readEnv());
    await app.ready();
    app.server.emit("request", request, response);
  };
}

export default createVercelHandler();