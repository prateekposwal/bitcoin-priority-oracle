# External Reproducer — Verified Contact List

**Purpose:** shortlist of real, uninvolved people/groups who could run the 3-step
reproduction protocol (SCCR). Every channel below was **verified by fetching the
linked page on 2026-08-03** — no emails are invented. Where an email could not be
verified as public, the verified public channel is given instead and the email is
explicitly marked **not public**.

**Rule:** do not fabricate contact info. If a profile has no public email, record
the verified public profile/issue/form and mark the email "not public". Only
channels actually confirmed to exist are listed.

---

## 1. Bitcoin Core contributor

### Gloria Zhao (@glozow) — *category best fit*
| Field | Verified value |
|---|---|
| Role | Bitcoin Core maintainer / contributor (orgs: `bitcoin`, `bitcoin-core`); founder of Bitcoin Core PR Review Club; mempool & package relay work (`bitcoin-notes` repo) |
| Why they fit | The SCCR is a fee-market measurement; Zhao works on the mempool/fee-estimation machinery itself — the best-positioned person to catch a subtle data or formula issue |
| Email | **NOT PUBLIC** — GitHub profile shows only a PGP key, no email |
| Verified channel | GitHub profile `https://github.com/glozow` (issue/DM path), or the Bitcoin Core PR Review Club |
| Source | `https://github.com/glozow` (fetched 2026-08-03) |

## 2. Chaincode Labs (research center)

### Chaincode Labs (org channel)
| Field | Verified value |
|---|---|
| Role | Independent Bitcoin R&D center, NYC. Team verified on site: Alex Morcos & Suhas Daftuar (co-founders), Pieter Wuille, Carla Kirk-Cohen (Exec Dir), Matthew Zipkin, Antoine Poinsot, et al. |
| Why they fit | A Bitcoin research institute whose staff include the people who understand block-space economics and reproducibility (Pieter Wuille also co-authors protocol papers with replication practices) |
| Email | **`info@chaincode.com`** ✅ public (listed on `/about` with mailto) |
| Verified channel | `info@chaincode.com` · @ChaincodeLabs (X) · phone 212.273.0450 |
| Source | `https://chaincode.com/about`, `https://chaincode.com/team` (fetched 2026-08-03) |
| Note | Individual staff emails are **not published** on the team page — use the org inbox, not a guessed address |

## 3. University crypto/econ researchers (Bitcoin fee markets)

### Daniel Aronoff — *closest cited author*
| Field | Verified value |
|---|---|
| Role | MIT Media Lab Digital Currency Initiative Collaborator; Research Affiliate, MIT Dept. of Economics; author of **arXiv:2604.17183 "A Model and Estimation of the Bitcoin Transaction Fee"** (the working paper's fee-market citation) |
| Why they fit | The paper's fee-formation reference; his site shows he publishes **replication packages** (AER 2026) — a reproducibility-conscious peer is the ideal validator of assumptions |
| Email | **`daronoff@mit.edu`** ✅ public (mailto on his site, "Academic inquiries") |
| Verified channel | `daronoff@mit.edu` (academic) · `danieljaronoff@gmail.com` (general) · LinkedIn |
| Source | `https://danielaronoff.github.io/` (fetched 2026-08-03) |

### Zhixuan Fang — *prior-work co-author*
| Field | Verified value |
|---|---|
| Role | Assistant Professor, Institute for Interdisciplinary Information Sciences (IIIS), Tsinghua University; co-author of **arXiv:2103.05866 "An Incentive Mechanism for Sustainable Blockchain Storage"** — the exact storage-cost-vs-fees topic the SCCR measures; related work "Mechanisms Design for Blockchain Storage Sustainability" is an ESI Hot/Highly Cited Paper |
| Why they fit | His 2021 paper argued fees may not cover storage; the SCCR is the first direct measurement of that ratio — he is the natural critical reader |
| Email | **`zfang@mail.tsinghua.edu.cn`** ✅ public (published on his homepage as `zfang [AT] mail.tsinghua.edu.cn`) |
| Verified channel | email above · homepage `https://people.iiis.tsinghua.edu.cn/~fang/` |
| Source | homepage (fetched 2026-08-03) |

### Jianwei Huang — *prior-work senior author*
| Field | Verified value |
|---|---|
| Role | Presidential Chair Professor & Associate Vice President, CUHK-Shenzhen; IEEE Fellow; senior author of arXiv:2103.05866; NCEL lab (Yunshu Liu, first author of 2103.05866, is his PhD alum; Fang was his postdoc) |
| Why they fit | The 2103.05866 lineage (storage sustainability incentives) originated in his lab — highest-signal academic addressee for the "did we miss an assumption" question |
| Email | **`jianweihuang@cuhk.edu.cn`** ✅ public (published on his homepage as `jianweihuang [at] cuhk.edu.cn`) |
| Verified channel | email above · homepage `https://jianwei.cuhk.edu.cn` |
| Source | homepage (fetched 2026-08-03) |

## 4. Bitcoin Optech / Delving Bitcoin

### Bitcoin Optech
| Field | Verified value |
|---|---|
| Role | Industry education nonprofit — weekly newsletter, podcast, analyses of Bitcoin software/services |
| Why they fit | The audience that would actually run a clean-clone reproduction; newsletter can carry a "can you verify a number?" callout |
| Email | **`info@bitcoinops.org`** ✅ public (listed in site footer) |
| Verified channel | `info@bitcoinops.org` · GitHub org `bitcoinops` |
| Source | `https://bitcoinops.org/` (fetched 2026-08-03) |

### Delving Bitcoin
| Field | Verified value |
|---|---|
| Role | The Bitcoin protocol research forum (Discourse; 592 topics, 1,202 users). Admins/mods verified: Ruben Somsen, Anthony Towns, mzumsande, 0xB10C, Matthew Zipkin |
| Why they fit | The venue where Bitcoin's deepest technical readers discuss protocol economics; a "reproduce a public measurement" thread fits the forum's norms |
| Email | **`staff@delvingbitcoin.org`** ✅ public (site's official contact_email) |
| Verified channel | `staff@delvingbitcoin.org` · forum `https://delvingbitcoin.org` |
| Source | `https://delvingbitcoin.org/about.json` (fetched 2026-08-03) |
| Note | Individual moderators' emails are **not published** — use the staff inbox, not guessed addresses |

## 5. Bitcoin / blockchain data engineer

### 0xB10C (b10c) — *highest-probability independent run*
| Field | Verified value |
|---|---|
| Role | Independent Bitcoin data engineer (OpenSats-funded); built **transactionfee.info, mempool.observer, mainnet.observer, miningpool-observer**; Bitcoin Core contributor (USDT tracepoints); Chaincode Residency alum; Delving Bitcoin moderator |
| Why they fit | Lives in Bitcoin fee/data pipelines every day; is the single most likely candidate to actually clone, run, and spot a data-quality or pipeline issue in minutes |
| Email | **`blog@b10c.me`** ✅ public (published on his site obfuscated as `blog[at]b10c.me` — de-obfuscate on send) |
| Verified channel | `blog@b10c.me` · Matrix `@b10c:matrix.org` · X `@0xB10C` · GitHub `@0xB10C` |
| Source | `https://b10c.me`, `https://github.com/0xB10C` (fetched 2026-08-03) |

---

## What could NOT be verified (honest gaps)

- **Gloria Zhao**: no public email anywhere on her GitHub profile (PGP key only).
  Channel is GitHub profile / X / PR Review Club — higher friction, lower priority.
- **Individual Chaincode staff** (Wuille, Kirk-Cohen, Zipkin, Poinsot…): no public
  emails on the team page → use `info@chaincode.com`.
- **Individual Delving moderators** (Towns, Somsen…): no public emails verified →
  use `staff@delvingbitcoin.org`.
- **Man Hon Cheung** (CityU HK; third author of arXiv:2103.05866): identified, but
  no page was fetched/verified this session → **excluded** rather than guessed.
- **arXiv "view email" reveal pages** (Aronoff's arXiv submission email): not
  scraped — arXiv hides them behind a challenge; his site's public `daronoff@mit.edu`
  is the verified channel instead.

## Suggested send order (first → last)

1. **0xB10C** — `blog@b10c.me` (fastest, most likely to actually run; best clean-clone tester)
2. **Daniel Aronoff** — `daronoff@mit.edu` (highest validation value; cited fee-market author)
3. **Zhixuan Fang / Jianwei Huang** — university emails (prior-work authors)
4. **Optech / Delving / Chaincode** — org inboxes (broadest reach, slowest turnaround)
5. Gloria Zhao — GitHub/X only, if others decline

---

*Bitcoin Sahi Research — external reproducer contact list, verified 2026-08-03.*
