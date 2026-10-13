// The data contract's version check (story W2, exepex/trading P1's rule): a payload is read only when its schema's
// major version is the one this app is built against (api/openapi.yaml info.version; a test keeps them equal). A minor
// or patch difference only adds optional fields; a major difference may change meanings, so the page shows the
// incompatibility screen instead of parsing it. Pure.
import { BlockIncompatible } from "../ui/block-states.ts";

export const CONTRACT_MAJOR = 2;

/** Throws BlockIncompatible unless `schemaVersion` ("2.4.0") has this app's major version. */
export function checkContractVersion(schemaVersion: string | null): void {
  const major = Number(/^(\d+)\./.exec(schemaVersion ?? "")?.[1]);
  if (major !== CONTRACT_MAJOR) throw new BlockIncompatible(schemaVersion ?? "unstated", CONTRACT_MAJOR);
}
