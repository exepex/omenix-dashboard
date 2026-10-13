# 38 Strategy lab: changes after the owner's sign-off

Signed off on 13 Oct 2026 as of 32ad873. Every later change is listed here with its reason; a change to what the screen shows
or to the contract needs the owner's sign-off again, a data correction does not.

- **13 Oct 2026: correctness fix to the contract, judge 55 (FAIL, one should-fix and one minor; the orchestrator agreed).**
  - **Should-fix: profit on the wrong cost basis.** F&O profit and the readiness bar used market charges only. The
    desk's verdict is "net account result after execution and operating costs" (DESK_DESIGN 12.8), and S2 reports
    gross, execution costs, AI and data costs, and net per book. The stock side had the same gap: its go-live bar is on
    "your cost" (SPEC F7.2, decision 50), and AI costs are real costs for the AI team there too.
    - Fix: a `costs` series per family and book (own charges and AI and data costs a day, allocated, not a bill).
    - Every headline profit, the period table and chart, month by month, the total line and every money check of the
      readiness bar are now after every cost. Each card shows the way from the trades' result to the net.
    - Trade-level figures stay after market charges and say so.
    - Without published costs (the real stock records), figures read "market charges only" and no money check is ticked.
    - Data gap recorded for the stock tool: `your_costs` on settled trades and AI and data costs per family.
  - **Example data:** costs added (made up), and the Hybrid F&O profile made a little stronger so the good case (a family
    ready after every cost) still exists. Results after every cost:
    - F&O: Hybrid +₹83,055 (ready); Rule-based −₹7,785 (was +₹215 before costs); AI team −₹1,28,325.
    - India stocks: Rule-based +₹76,640; AI team −₹1,86,044.
    - US stocks: Rule-based −$2,758, its trades' profit eaten by the 0.75% currency fee each way.
  - **Minor: a total that did not add up as shown** (AI team −₹1,24,474 + −₹59,925 shown as −₹1,84,400). Each part is now
    rounded to the rupee first and the total summed from the parts shown. New check `check_totals.js` (9 lines add up;
    it fails on the old build).
  - What the screen shows and how it is laid out are unchanged, so no new owner sign-off is needed (orchestrator).
