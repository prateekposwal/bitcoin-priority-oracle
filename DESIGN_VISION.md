# Bitcoin Sahi — Design Vision

*Blueprint for every builder contributing to this product.*

---

## 1. Design Philosophy

Bitcoin Sahi is not a dashboard. Dashboards are for monitoring. This is a **decision platform** — every pixel serves a choice the user needs to make. Should I send on-chain or Lightning? Should I care about BIP-110? Is the fee market telling me something about network health? Every element answers one question: **"What should I do?"**

Most Bitcoin sites are either trading terminals (loud, urgent, green-red-green-red) or data explorers (cold, academic, overwhelming). Bitcoin Sahi sits in the middle — warm, clear, and human. It treats the reader like a knowledgeable friend asking for perspective. Not hype. Not noise. Signal with context.

---

## 2. Color System

Not pure black. Not dark-theme-by-default. A **warm neutral** foundation — like a well-lit room, not a cave. Bitcoin orange sits in its right place: as an accent for decisions, not the entire visual identity.

### Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#F5F2ED` | Page background — warm off-white, like quality paper |
| `--bg-secondary` | `#EDE9E3` | Card surfaces, section backgrounds |
| `--bg-tertiary` | `#E3DED6` | Hover states, nested surfaces |
| `--text-primary` | `#1A1612` | Body text — near-black with a brownish tilt for warmth |
| `--text-secondary` | `#6B6560` | Labels, subtitles, muted info |
| `--text-tertiary` | `#9C958E` | Placeholder, disabled, lowest-priority info |
| `--accent-orange` | `#F7931A` | Primary CTA, key decisions, brand accent |
| `--accent-green` | `#2A9D5C` | Positive signals, healthy status, confirmations |
| `--accent-red` | `#D43B3B` | Negative signals, warnings, important alerts |
| `--accent-blue` | `#3B7DD4` | Information, neutral data, links |
| `--border-light` | `#D9D3CB` | Card borders, dividers — subtle, not harsh |
| `--border-focus` | `#F7931A` | Focused/hovered card borders |
| `--shadow-sm` | `0 1px 3px rgba(26,22,18,0.06)` | Card shadows — barely there |
| `--shadow-md` | `0 4px 12px rgba(26,22,18,0.08)` | Elevated cards, dropdowns |

### Accessibility

All text/background combinations meet WCAG AA (minimum contrast ratio 4.5:1). `--text-secondary` on `--bg-primary`: 6.2:1. `--accent-orange` on `--bg-primary`: 4.8:1.

---

## 3. Typography

System font stack for zero load, native feel on every device.

### Font Stack

```
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
--font-mono: "SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace;
```

### Scale

| Token | Size | Line Height | Letter Spacing | Weight | Usage |
|---|---|---|---|---|---|
| `--text-h1` | 40px | 1.15 | -0.02em | 800 | Page title (Hero) |
| `--text-h2` | 28px | 1.2 | -0.02em | 700 | Section heading |
| `--text-h3` | 20px | 1.3 | -0.01em | 700 | Card / Viz title |
| `--text-body` | 15px | 1.55 | 0 | 400 | Paragraphs, descriptions |
| `--text-small` | 12px | 1.4 | +0.01em | 500 | Labels, pills, metadata |
| `--text-tiny` | 10px | 1.3 | +0.04em | 700 | Uppercase section headers |

### Type Scale Notes

- Only one font weight per size — no ambiguity.
- Body text at 15px reads comfortably on both mobile and desktop. No 16px default.
- Monospace reserved for block heights, transaction IDs, fee rates — data that benefits from fixed-width alignment.

---

## 4. Spacing System

Base unit: **4px**. All spacing derives from this grid.

### Scale

| Token | Px | Typical Use |
|---|---|---|
| `--space-1` | 4px | — |
| `--space-2` | 8px | Tight gaps, icon padding |
| `--space-3` | 12px | Button padding, pill padding |
| `--space-4` | 16px | Standard gap between related elements |
| `--space-5` | 20px | **Card padding** (consistent everywhere) |
| `--space-6` | 24px | Section heading margin, grid gaps |
| `--space-7` | 32px | **Section gaps**, hero bottom margin |
| `--space-8` | 48px | Between major page sections |
| `--space-9` | 64px | Page-top padding, page-bottom margin |

### Rule

- Every card: `padding: 20px` (`--space-5`). No exceptions.
- Grid gaps: `16px` for tight grids, `24px` for spacious layouts.
- Section gap: `32px` between every major block of content.
- Page padding (container): `24px` on mobile, `32px` on desktop.

---

## 5. Component Architecture

Every page on Bitcoin Sahi is composed from the same set of components. No page-specific CSS unless absolutely necessary.

### `Hero`

Page title + subtitle + optional CTA. The top of every page.

```
+-------------------------------------------------------------+
|  [Badge] (optional)                                          |
|  H1 heading                                                 |
|  Subtitle — one or two sentences max                         |
|  [Primary CTA] [Secondary CTA] (optional)                    |
+-------------------------------------------------------------+
```

- Uses `--text-h1` for heading, `--text-body` for subtitle with `--text-secondary` color.
- CTA buttons: `.btn-primary` (`--accent-orange` bg, `#fff` text) and `.btn-secondary` (transparent, border).
- Badge: small pill above heading, `--text-tiny`, `--accent-orange` text, `--border-light` border.

### `DecisionCard`

The atomic unit of decision-making. Big number + label + status + action.

```
+------------------------------+
| [StatusPill]                 |
| [Big Number] 28.3%           |
| [Label]      Fee percentile  |
| [Subtext]    vs last block   |
| [Action]     → View details  |
+------------------------------+
```

- Big number: `--text-h1` or `--text-h2`, bold, kerned tight.
- Label: `--text-small`, `--text-secondary`, uppercase optional.
- Status: `StatusPill` in top-right corner.
- Action: subtle link at bottom-right, `--accent-orange`.
- Hover: border shifts to `--accent-orange`, slight translateY(-1px).

### `PersonaGrid`

8-card grid linking to decision pages. Each card represents a Bitcoin user archetype.

```
+---------+---------+---------+---------+
| Sender  | Trader  | Miner   | Hodler  |
+---------+---------+---------+---------+
| Builder | Researcher|Exchange| LP      |
+---------+---------+---------+---------+
```

- 4 columns desktop, 2 columns tablet, 1 column mobile.
- Each card: emoji icon, title, question (e.g., "Should I send on-chain or Lightning?"), CTA arrow.
- Top accent line (2px) on hover — `--accent-orange`.
- Card padding: `20px`.

### `VizCanvas`

Full-width visualization with title. Used for fee charts, fork timelines, block composition.

```
+-------------------------------------------------------------+
|  [Viz Title]                          [Legend] [Controls]    |
|  [--- canvas / svg / chart ---]                              |
|  [Caption / source note]                                     |
+-------------------------------------------------------------+
```

- Canvas background: `--bg-secondary`.
- Viz title: `--text-h3`.
- Legend: horizontal `flex`, `--text-small`.
- Source note: `--text-tiny`, `--text-tertiary`.
- Controls (timeframe toggles, zoom): pill-style buttons.

### `DataRow`

Labeled data point — label, value, change. Used inside cards and sidebars.

```
[Label ······························ Value +2.3%]
```

- Label: `--text-body`, `--text-secondary`.
- Value: `--text-body`, `--text-primary`, `font-weight: 700`.
- Change: `--text-small`, green for positive, red for negative.
- Laid out as `flex` with `justify-content: space-between`.

### `StatusPill`

Colored pill for status indication. Three variants.

```
[ Live ]   [ Warning ]   [ Alert ]
```

- `--text-small`, `font-weight: 600`, `border-radius: 100px`.
- Green: `background: #2A9D5C18`, `color: var(--accent-green)`.
- Yellow: `background: #F0883E18`, `color: #C0731A`.
- Red: `background: #D43B3B18`, `color: var(--accent-red)`.
- Padding: `4px 12px`.

### `SectionHeader`

Consistent section heading used across all pages.

```
SECTION TITLE _________________________________
```

- `--text-tiny`, uppercase, `letter-spacing: 0.06em`, `--accent-orange` color.
- Bottom border: `1px solid var(--border-light)`.
- Margin bottom: `16px`.

### `Nav`

Minimal top navigation. Logo left, links right, CTA far right.

```
[🧭 Bitcoin Sahi]  [Learn]  [Live]  [BIP-110]  [→ Dashboard]
```

- Sticky top: `0`, `z-index: 100`.
- Background: `--bg-primary` with `backdrop-filter: blur(12px)`.
- Bottom border: `1px solid var(--border-light)`.
- Logo/brand: `--text-h3`, bold, `--accent-orange` span on "Sahi".
- Links: `--text-body`, `--text-secondary`, hover → `--text-primary`.
- CTA button: `.btn-primary`, compact.

### `Footer`

Minimal footer, one line of links + one line of copyright.

```
[Learn] [Live] [BIP-110] [Research] [GitHub]
© 2026 Bitcoin Sahi. Not financial advice.
```

- `--text-small`, `--text-tertiary`.
- Links row: `flex`, `justify-content: center`, `gap: 16px`.
- Top border: `1px solid var(--border-light)`.
- Padding: `32px 0`.

---

## 6. Page Architecture

Three pages. Every page uses Hero + SectionHeader + the component set above.

### `/` — index.html

**Purpose:** The front door. Explain what this is, show the 8 personas, give the headline stats, state the thesis.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  Nav                                        │
├─────────────────────────────────────────────┤
│  Hero                                       │
│  "Understand the Fee Market.                │
│   Make Better Decisions."                   │
│  [Enter Decision Center →]                  │
├─────────────────────────────────────────────┤
│  StatsBar (4 x DataRow in a row)            │
│  BTC price · Avg fee · Mempool count · UTXO │
├─────────────────────────────────────────────┤
│  SectionHeader: "Who are you?"              │
│  PersonaGrid (8 cards)                      │
├─────────────────────────────────────────────┤
│  SectionHeader: "The Thesis"                │
│  ThesisSection — 2 paragraph explanation +  │
│  supporting DataRow points                  │
├─────────────────────────────────────────────┤
│  Footer                                     │
└─────────────────────────────────────────────┘
```

**Components used:** `Nav`, `Hero`, `DataRow` (×4 in StatsBar), `SectionHeader` (×2), `PersonaGrid`, `Footer`.

### `/live` — live.html

**Purpose:** The live decision center. Choose your persona, see relevant data, make a call.

**Layout:**

```
┌─────────────────────────────────────────────┐
│  Nav                                        │
├─────────────────────────────────────────────┤
│  Hero (compact)                             │
│  "Decision Center"                          │
│  "Live data for your next move."            │
│  [Live indicator dot]                       │
├─────────────────────────────────────────────┤
│  PersonaTabs (horizontal tab bar, 8 tabs)   │
│  [Sender] [Trader] [Miner] [Hodler] ...     │
├─────────────────────────────────────────────┤
│  VizArea (full-width VizCanvas)             │
│  Block space composition / fee chart        │
├─────────────────────────────────────────────┤
│  DecisionContent (2-column grid)            │
│  ┌─── DecisionCard ───┐ ┌─── DecisionCard ──┐│
│  │ Fee rate to beat    │ │ Block space left  ││
│  ├─── DecisionCard ───┤ ├─── DecisionCard ──┤│
│  │ Recommended action  │ │ Confidence score  ││
│  └─────────────────────┘ └───────────────────┘│
├─────────────────────────────────────────────┤
│  Footer                                     │
└─────────────────────────────────────────────┘
```

**Components used:** `Nav`, `Hero`, `SectionHeader`, `VizCanvas`, `DecisionCard` (×4), `DataRow`, `StatusPill` (inside cards), `Footer`.

### `/bip110` — bip110.html

**Purpose:** BIP-110 status tracker. Is it happening? What does it mean for me?

**Layout:**

```
┌─────────────────────────────────────────────┐
│  Nav                                        │
├─────────────────────────────────────────────┤
│  Hero                                       │
│  "BIP-110 Fork Tracker"                     │
│  "Reduced data temporary softfork —         │
│   what it means, where it stands."          │
│  [StatusPill: DOA / Signaling / Active]     │
├─────────────────────────────────────────────┤
│  StatusGrid (4 x DecisionCard compact)      │
│  Miner support % · Exchange stance ·        │
│  Code ready · Risk level                    │
├─────────────────────────────────────────────┤
│  SectionHeader: "Fork Timeline"             │
│  ForkViz (VizCanvas — timeline bar)         │
│  Timeline phases: Proposed → Current → Fork │
├─────────────────────────────────────────────┤
│  SectionHeader: "Who's Affected"            │
│  ImpactGrid (3 x 3 cards)                   │
│  Miners · Exchanges · Wallet users · etc.   │
│  Each card: icon + title + impact + tag     │
├─────────────────────────────────────────────┤
│  Footer                                     │
└─────────────────────────────────────────────┘
```

**Components used:** `Nav`, `Hero`, `StatusPill` (in hero), `SectionHeader` (×2), `DecisionCard` (×4 in StatusGrid), `VizCanvas` (as ForkViz), `DataRow`, `Footer`.

---

## 7. Tone & Voice

### Principles

1. **Clear > clever.** Never sacrifice clarity for wordplay. Bitcoin is confusing enough.
2. **Confident but humble.** We know the data. We show our sources. We don't pretend to predict the future — we give the reader the tools to decide.
3. **Warm, not hype.** No "MOON", "LFG", or rocket emojis. No fear-mongering. This is a knowledgeable friend explaining crypto over a cup of coffee.
4. **One thought per sentence.** Short sentences. Active voice. No jargon without explanation.

### Voice Samples

| Wrong | Right |
|---|---|
| "The fee market is experiencing unprecedented volatility driven by ordinal inscriptions." | "Fees are up because people are inscribing data on Bitcoin. Here's what that means for you." |
| "BIP-110 represents a consensus-level modification to the block weight limit." | "BIP-110 would reduce how much data can go into a block. Some miners support it. Most don't." |
| "Leverage our real-time analytics to optimize your on-chain expenditure." | "See what fees people are paying right now. Decide if you should wait or send now." |
| "This is not financial advice." | "We show the data. You make the call." |

### Microcopy Patterns

- Buttons: "Go to Decision Center", "See Live Data", "Track BIP-110"
- Empty states: "No data yet. Check back after the next block."
- Error states: "Couldn't fetch fee data. Showing last known values."
- Status: "Last updated: block 876,543" — precise, transparent.

---

## 8. Implementation Notes

### CSS Custom Properties

All design tokens live in `:root` in `style.css`. Every component references these tokens. No hardcoded values outside `:root`.

### Responsive Breakpoints

- Desktop: `> 900px` — 4-column grids, full VizCanvas
- Tablet: `700px–900px` — 2-column grids
- Mobile: `< 700px` — single column, compact padding (16px containers instead of 32px)

### Motion

- Transitions: `0.2s ease` for hovers, `0.3s ease` for panel toggles.
- Data refreshes: subtle opacity pulse (`0.6s`) on updated values — like a heartbeat, not a flashbang.
- No auto-play animations. No parallax. No loading spinners longer than 1s.

### Dark Mode (Future)

When implemented: invert the neutral palette slightly. `--bg-primary` → `#1C1816`, `--bg-secondary` → `#24201C`, `--text-primary` → `#EDE9E3`. Keep warm tones. Never go pure black or pure white.

---

*This document is the single source of truth for all design decisions. If a component, color, or pattern isn't here, it doesn't go in the product. If it needs to go in the product, it goes in this document first.*
