// The F&O screens' held-back notice (contract 2.12.0's card `withheld` and 2.13.0's page holds; owner, 16 Oct 2026:
// "say so on screen"): one red alert, the reason in bold and the rest of the sentence after it. Design-system classes
// only; the words come from the caller's view.
import { Icon } from "../ui/icon.tsx";

export const HeldNotice = ({ bold, rest = "" }: { bold: string; rest?: string }) => (
  <p className="mb-alert danger held" role="alert"><Icon name="block" /><span><b>{bold}</b>{rest}</span></p>
);
