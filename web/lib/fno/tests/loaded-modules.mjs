// Records every module a process loads (story W2's runtime check that examples are never loaded with a database).
import { registerHooks } from "node:module";

globalThis.loadedModules = [];
registerHooks({
  load(url, context, next) {
    globalThis.loadedModules.push(url);
    return next(url, context);
  },
});
