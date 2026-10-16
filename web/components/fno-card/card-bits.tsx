// Today's card's small shared parts (story W3f; design/mockups/39-trade-card 1-base.js): a fact, a label from a look
// and the owner-only mark (live strikes and entry ranges stay in Drive and the signed-in dashboard, owner 15 Oct 2026).
import type { Look } from "../../lib/fno-card/view.ts";
import { Icon } from "../ui/icon.tsx";
import { Label } from "../ui/primitives.tsx";

export const Fact = ({ k, v, note }: { k: string; v: string; note?: string }) => (
  <div className="mb-fact"><span className="k">{k}</span><b>{v}</b>{note ? <small>{note}</small> : null}</div>
);

export const LookLabel = ({ look }: { look: Look }) => <Label tone={look.tone} icon={look.icon}>{look.word}</Label>;

export const OwnerOnly = () => (
  <span className="owner" data-tip="Owner only: live strikes and entry ranges are kept in Google Drive and your signed-in dashboard, never in a public repository (owner, 15 Oct 2026)."><Icon name="lock" />Owner only</span>
);
