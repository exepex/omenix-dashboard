// The weather screen's own small part (story W3a; design/mockups/40-weather 1-base.js): a colour label. A colour is
// never shown alone: its glyph and its word go with it. The F&O screens' shared parts are in ../fno-common.
import type { colourLabel } from "../../lib/fno-weather/view.ts";
import { Label } from "../ui/primitives.tsx";

export const ColourLabel = ({ look }: { look: ReturnType<typeof colourLabel> }) => <Label tone={look.tone} icon={look.icon}>{look.word}</Label>;
