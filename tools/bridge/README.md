# ⬡ BSAHI Relay Node

A decentralized content relay that bridges BSAHI's Nostr research to Twitter and Reddit.

Anyone can run a relay node. Your accounts, your platforms, BSAHI's content.

## How It Works

```
BSAHI Employees → Nostr → BSAHI Relay Node → Your Twitter
                    ↓                       → Your Reddit
              Community Relays
                    ↓
              More platforms
```

- BSAHI publishes research to Nostr (5 employees, hourly)
- Your relay node subscribes to their Nostr keys
- When new content appears, your relay posts it to your connected accounts
- BSAHI doesn't need platform accounts — the community is the distribution layer

## Quick Start

### 1. Install

```bash
git clone https://github.com/prateekposwal/block-space-economics.git
cd block-space-economics
npm install
```

### 2. Connect Your Accounts

```bash
node tools/bridge/relay-node.js --connect
```

Browser opens twice — once for Twitter, once for Reddit.

| Step | What to do |
|------|-----------|
| 1 | Browser opens to Twitter |
| 2 | Log into your account |
| 3 | Close the browser |
| 4 | Browser opens to Reddit |
| 5 | Log into your account |
| 6 | Close the browser |

Your session is saved locally. Never shared, never uploaded.

### 3. Start the Relay

```bash
node tools/bridge/relay-node.js --run
```

That's it. The relay runs in your terminal. It:
- Connects to 4 Nostr relays
- Monitors BSAHI's research pubkeys
- Posts new content to your Twitter and Reddit
- Logs everything to the console

### 4. (Optional) Run 24/7

```bash
nohup node tools/bridge/relay-node.js --run &
```

Or set up a launchd/cron job to keep it alive.

## Privacy

- Your platform credentials stay on YOUR machine
- The relay only reads Nostr events — it doesn't send data anywhere
- Sessions are stored in `relay-data/profiles/` — never committed to git
- Each platform gets its own browser profile

## Requirements

- Node.js 18+
- macOS (for Chrome automation)
- Twitter account (free)
- Reddit account (free)

## Why Run a Relay?

- **Support Bitcoin research** — amplify block space economics to your network
- **Early access** — BSAHI content hits your feed before anyone else's
- **Build your brand** — share high-quality research with your followers
- **Decentralize distribution** — no single point of failure, no platform dependency

## Architecture

```
nostr-tools (SimplePool)
     ↓
  [1] Subscribe to BSAHI pubkeys
     ↓
  [2] Parse event content
     ↓
  [3] Post to connected platforms via Playwright
     ↓
  [4] Log to console
     ↓
  [5] Wait for next event
```

The relay uses:
- **nostr-tools** — Nostr protocol client
- **Playwright** — Browser automation for platform posting
- **Chrome profiles** — Each platform's session stored separately

## License

MIT — run it, fork it, share it.
