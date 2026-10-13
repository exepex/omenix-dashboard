// Numbers that name their source (stories W9, W12): each renders one block field, carries the field's source name in
// `data-src` (lib/ui/sources.ts), and shows "—" for a missing value, so the UI checks can compare every figure with
// exactly its field. `scale` is the factor between the field and the number shown (a 0-1 chance shown as percent: 100).
import { DASH, signed } from "../../lib/ui/format.ts";

interface Fig {
  value: number | null | undefined;
  src: string;
  decimals?: number;
  tip?: string;
}

/** A plain number in the market's grouping ("1,09,01,705" in India), with an optional unit after it. */
export function Num({ value, src, decimals = 2, locale, unit = "", scale, tip }: Fig & { locale: string; unit?: string; scale?: number }) {
  const shown = value === null || value === undefined ? DASH : (value * (scale ?? 1)).toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + unit;
  return <span className={shown === DASH ? "muted" : undefined} data-src={src} data-scale={scale} data-tip={tip}>{shown}</span>;
}

/** A change in percent points with its sign and colour (never colour alone); "—" when there is no price that far back. */
export function Chg({ value, src, decimals = 2, tip }: Fig) {
  if (value === null || value === undefined) return <span className="muted" data-src={src} data-tip={tip ?? "No price that far back (listed later)."}>{DASH}</span>;
  return <span className={`mb-delta ${value > 0 ? "up" : value < 0 ? "down" : "flat"}`} data-src={src} data-tip={tip}>{signed(value, decimals)}</span>;
}
