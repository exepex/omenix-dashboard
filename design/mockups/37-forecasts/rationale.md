# 37 Forecast contest: why it looks like this

- **One question a beginner can hold: who reads NIFTY best?** (Owner's feedback, 13 Oct 2026: more pictures and data,
  who is winning and losing and why.) The page reads top to bottom as: who is winning (ranked cards with points, a
  small running line and a one-line why), the race (all families on one chart, running total by day or bars by week or
  month, all five questions or one), question by question (coloured tiles with the official verdict), why they win or
  lose (points won against points lost, habits side by side with the yardstick, costliest misses, who beats whom),
  today's calls, then one question in full detail.
- **Points instead of Brier at the top.** "Points ahead of the yardstick" reads like a sports table; the miss score
  stays one tap away in each card and in the detail.
- **No rank before 40 settled days.** An early lead on six forecasts is noise; the card says so instead of crowning it.
- **Profit decides, said at the top.** A good forecaster could still lose money; the screen must never suggest that a
  family trades because it forecasts well (design 12.7).
- **Verdicts in three channels.** Each verdict has a glyph, a word and a colour (tick and green "Better, proven"; cross
  and red "Worse, proven"; flat arrow and grey "No clear difference"; timer and amber "Not proven yet"; block and grey
  "Not running yet"), owner's rule: never colour alone.
- **"Not proven yet" is a number, not a mood.** Each test shows its settled days against the 40 it needs, and until the
  first review every gap is shown but not judged, so an early lead cannot be read as proof.
- **Plain words for the statistics.** "Miss score" for the Brier score (0 perfect, 0.25 = always saying 50%), "likely
  range" for the bootstrap interval, "honest about its confidence" for calibration, "45 tests at once" for the
  multiple-comparison correction; each block has a "how to read it" line.
- **Every element has its good, bad and empty case:** the empty real state with its reason and steps; families
  winning, losing and level; a family not running (never shown as zero); a missed day (counted, never scored); a day
  with no answer (never scored); a forecaster too sure of itself and one close to honest; leaned the right and the wrong way.
- **Examples cannot pass for history:** they are labelled Example, made up, and counted in day numbers, not dates.
- **Strategy internals stay private:** the screen shows the chances each family gave and how they scored, never how
  it forecasts. The yardsticks, which are public research methods, are explained.
- **India only:** the whole screen is F&O, so it is absent in the US market (nav item and page).
- Reused design-system parts only: `.mb-pagehead`, `.mb-ap` family badges, `.mb-dir`, `.mb-mark`, `.mb-label`,
  `.mb-fact`, `.md-progress`, `.md-segmented`, `.md-table`, `details.md-expansion`, `.quiet`, `svg.plot` with chart tokens.
