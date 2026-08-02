# External Reproducer — Recruit Message (ready to send)

**Package:** copy-paste the message below into an email/DM to one uninvolved person.

---

## The message to send (non-technical, self-contained, ~15 min)

> **Subject: Can you verify a number for me? (15 min, no crypto knowledge needed)**
>
> Hi [Name],
>
> I'm submitting a research paper and one requirement is that someone *not
> involved in the project* independently re-checks the headline number — a
> way of proving it isn't just whatever I said it was. You're perfect for
> this: it requires **no Bitcoin or math background**.
>
> What I measured: the average fee paid to store Bitcoin's data, compared
> against what that storage actually costs the network. The result was
> **0.2186** (a ratio — fees cover about 22% of modeled storage cost).
>
> What you'd do (~15 minutes, any computer):
>
> 1. Download the data file (a small JSON text file, 171 entries — you can
>    open it in any text editor to confirm it's 171 rows of numbers).
> 2. Run a tiny calculation with four given numbers (I give you the formula
>    and a plain-English explanation; you can use a spreadsheet, calculator,
>    or any language you like).
> 3. Compare your answer to my published result (0.2186 average, range
>    0.0584–0.8320) and tell me if they match.
>
> Everything you need — the data file, the 3-step instructions, and the
> expected result — is in one place:
> `https://github.com/prateekposwal/block-space-economics` →
> `research/reproduce/README.md` (the "External reproduction protocol"
> section).
>
> When you're done, just reply with: your average number, the min and max,
> what you used (spreadsheet/Python/calculator), and roughly how long it
> took. That's it.
>
> No account signups, no installs beyond what you already have, and if
> anything is confusing or looks wrong, that's exactly what I want to know.
>
> Thanks!
> Prateek

---

## What they need (the 3 things)

| # | Thing | Where |
|---|-------|-------|
| 1 | Frozen data file (171 entries) | `research/reproduce/input/fee_history_capture.json` |
| 2 | 3-step protocol | `research/reproduce/README.md` → *External reproduction protocol* |
| 3 | Reference outputs to compare against | Same README table (avg 0.2186, min 0.0584, max 0.8320, 100% below 1×) |

They should NOT need the SQLite DB, the repo's tooling, or Bitcoin knowledge.

## What to ask them to report back

- Their computed **avg SCCR** (must round to 0.2186)
- Their **min / max** (0.0584 / 0.8320)
- 100% of blocks below 1× ?
- What tool they used (spreadsheet / Python / other)
- Time taken
- Anything confusing or unexpected (this is a feature, not a bug — log it)

## Post-reply

Record the result row in `research/reproduce/external-reproduction.md`
(date, reproducer (anonymous ok), language, numbers, per-block max dev, verdict).

---

*Bitcoin Sahi Research — external reproducer recruit message, 2026-08-03.*
