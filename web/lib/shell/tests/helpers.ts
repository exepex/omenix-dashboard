// Shared test inputs: the fixture adapter's payload (the signed-off mockup's example records) and its frame data.
import type { Market } from "../../data/constants.ts";
import { money, price } from "../../ui/format.ts";
import type { FrameData, ShellPayload } from "../contract.ts";
import { fixtureShellData } from "../fixture-source.ts";
import { frameData } from "../view.ts";

export const payload: ShellPayload = await fixtureShellData.read();
export const frame = (market: Market): FrameData => frameData(payload, market);
export const fmt = (currency: string) => ({ money: (x: number) => money(currency, x, currency === "INR" ? 0 : 2), price: (x: number) => price(currency, x) });
