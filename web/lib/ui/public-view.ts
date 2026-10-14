// The one public view of a payload that mentions strategies (owner, 13 Oct 2026; W9 criterion 5): no strategy setting
// (lib/strategy-pages/public-strategies.ts), strategies named and addressed by their public labels and ids
// (strategy-names.ts), sentences in the dashboard's words (public-words.ts). Applied at every boundary data crosses into a screen: the API's read routes, the page read
// client, and the frame's and Home's fixture adapters. Pure; idempotent.
import { withoutInternals } from "../strategy-pages/public-strategies.ts";
import { withPublicWords } from "./public-words.ts";
import { applyDisplayNames } from "./strategy-names.ts";

export const publicView = <T>(payload: T): T => withPublicWords(applyDisplayNames(withoutInternals(payload) as T));
