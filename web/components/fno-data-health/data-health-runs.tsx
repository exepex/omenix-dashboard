// The F&O data health's runs (story W3e; design/mockups/44-data-health 2-health.js): the last publish and the evening
// health check, each with its status, its day and, for a failed publish, why. Every word comes from
// lib/fno-data-health/view.ts.
import type { FnoDataHealth } from "../../lib/fno-data-health/contract.ts";
import { checkOf, publishOf, type RunView } from "../../lib/fno-data-health/view.ts";
import { HowTo, Sec } from "../fno-common/screen-bits.tsx";
import { Label } from "../ui/primitives.tsx";

function Run({ title, run, howTo }: { title: string; run: RunView; howTo: string }) {
  return (
    <Sec title={title} aria={title}>
      <Label tone={run.look.tone} icon={run.look.icon}>{run.look.word}</Label>
      <p className="small run">{run.when}</p>
      {run.reason ? <p className="small reason">{run.reason}</p> : null}
      <HowTo>{howTo}</HowTo>
    </Sec>
  );
}

export function HealthRuns({ h }: { h: FnoDataHealth }) {
  return (
    <div className="runs">
      <Run title="The last publish" run={publishOf(h)} howTo="Runs every morning at 07:10 IST. A failed run keeps the previous pages; nothing half-written is shown." />
      <Run title="The daily health check" run={checkOf(h)} howTo="Runs at 17:51 IST and checks that every expected file and job of the day exists." />
    </div>
  );
}
