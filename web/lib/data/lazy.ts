// An adapter loaded on its first call (story W2): the wiring names the fixture adapters this way, so their examples are
// loaded only when no backend is configured, and never in a deployment that reads a database. Every method of a data
// interface returns a promise, so each one waits for the load. Not thenable: awaiting the adapter itself is not a call.
type Methods = Record<PropertyKey, (...args: unknown[]) => Promise<unknown>>;

export function lazyAdapter<T extends object>(load: () => Promise<T>): T {
  let loaded: Promise<T> | null = null;
  return new Proxy({} as T, {
    get: (_, method) => (method === "then" ? undefined : async (...args: unknown[]) => ((await (loaded ??= load())) as unknown as Methods)[method](...args)),
  });
}
