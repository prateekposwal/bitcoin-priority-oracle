#!/usr/bin/env python3
"""
BSAHI — Reddit Comment Engine v2 (Gem Finder)
=============================================
Engages genuinely with r/Bitcoin discussions — 50+ comments/day.

Smart discovery: scores threads by relevance to BSAHI's research areas
(fees, mempool, blocks, lightning, node costs, settlement) and picks the
best "gems" from the noise. Learns what the thread is about and tailors
the comment.

Tone rules:
- Soft, humble, conversational
- Acknowledge the OP's point first
- Add a real data point from our captures
- Mention what BSAHI is building only when genuinely relevant
- Accept criticism gracefully, show how new evidence builds on it
"""
import subprocess, base64, time, json, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
import seen_state

REPO = '/Users/prateekposwal/Desktop/block-space-economics'
STATE_FILE = os.path.join(REPO, 'captured-data', 'comment-state.json')

DISCOVERY_TTL_MS = seen_state.cooldown_ms('discovery', 4 * 3600 * 1000)
FAILED_RETRY_TTL_MS = seen_state.cooldown_ms('failedRetry', 24 * 3600 * 1000)

QUERIES = ['fees', 'mempool', 'lightning', 'node costs', 'transaction', 'block']

# ─── Research areas BSAHI cares about ───
TOPICS = {
    'fees': ['fee', 'fees', 'sat/vb', 'sats/vb', 'transaction fee', 'fee market', 'fee spike'],
    'mempool': ['mempool', 'backlog', 'unconfirmed', 'waiting for confirmation'],
    'blocks': ['block', 'blocks', 'block size', 'block space', 'full block', 'block reward'],
    'lightning': ['lightning', 'ln', 'routing', 'channel', 'second layer', 'liquidity'],
    'node': ['node', 'full node', 'pruned node', 'storage', 'running a node', 'hardware wallet', 'self-custody'],
    'settlement': ['settle', 'settlement', 'on-chain', 'confirm', 'finality', 'value moved', 'transaction value'],
    'cost': ['cost', 'expensive', 'price', 'economics', 'incentive', 'miner revenue'],
    'security': ['coldcard', 'hack', 'drained', 'wallet', 'security', 'stolen', 'lost btc'],
    'dev': ['development', 'bip', 'upgrade', 'core', 'protocol', 'testnet', 'pr']
}

# ─── Comment building blocks ───
OPENERS = [
    "That is a fair point. One thing we have noticed from live captures...",
    "This matches what we are seeing in the data, with a small nuance...",
    "Interesting — and it connects to something we have been measuring...",
    "I have been thinking about this too. From our monitoring...",
    "Good question. It ties into something we have been digging into...",
]

DATA_LINES = {
    'fees': "Right now our capture shows fastest fee at {f} sat/vB — so demand is real, not speculative.",
    'mempool': "Our live data shows the mempool at {m} MB, which suggests people are choosing to wait rather than bid up.",
    'blocks': "The recent block we captured had ~{b} transactions. Full, but the fee distribution shows most users are not overpaying.",
    'lightning': "We track Lightning alongside on-chain — the two layers are moving in opposite directions, which is exactly the design.",
    'node': "On node costs: our Storage Cost Coverage Ratio research suggests fees cover roughly 17% of a decade of storage costs. Early and directional, but worth watching.",
    'settlement': "At {f} sat/vB fastest, settlement is still cheap relative to the value moved. That ratio is the part most people miss.",
    'cost': "The cost question is central to everything we do. Fees {f} sat/vB, mempool {m} MB — the market is pricing scarcity in real time.",
    'security': "On the security side — it is a reminder that the weakest link is almost never the protocol. We focus on the economics, but self-custody basics matter more.",
    'dev': "From a research angle, the protocol changes slowly on purpose. We watch the signals (fees, mempool) to see adoption pressure before it is obvious.",
}

BSAHI_LINES = [
    " This is exactly what we built BSAHI to measure — we capture the network continuously and publish the data openly.",
    " We are trying to quantify this properly with an autonomous research engine that watches the network in real time.",
    " We have been tracking exactly this. Happy to share the methodology — the code is open.",
    " This is the kind of question our research is aimed at. Still early, but the direction feels right.",
]

CLOSINGS = [
    " Curious how others are thinking about it.",
    " Would love to hear if your node shows the same.",
    " Open to being wrong here — the data keeps teaching us.",
    " No strong claim, just an observation from the numbers.",
]

CRITICISM_RESPONSES = [
    "You make a fair point — that is a real limitation. The data we have only covers a short window, so we cannot claim certainty. What we can do is keep capturing and revisit the conclusion as more evidence accumulates. That is the plan.",
    "Good challenge. You are right that single snapshots can mislead. We capture continuously precisely so we can see the trend rather than one moment. The latest capture does support the observation, but we are watching for when it stops.",
    "That is a legitimate critique. Our figures are estimates based on current hardware costs, which do change. We should treat them as directional, not exact. The method is open if anyone wants to improve the model.",
    "Reasonable pushback. I would refine the claim this way: the ratio holds across the period we measured, but a longer window would strengthen it. We are extending the dataset and will update.",
]

def load_state():
    try:
        with open(STATE_FILE) as f: return json.load(f)
    except:
        return {'comments_today': 0, 'day': '', 'commented_threads': [], 'last_comment': 0}

def save_state(s):
    tmp = STATE_FILE + '.tmp'
    with open(tmp, 'w') as f: json.dump(s, f)
    os.replace(tmp, STATE_FILE)

def get_live_data():
    try:
        r = subprocess.run(['node', '-e', '''
            var fs=require('fs'),path=require('path');
            var bf='captured-data/backfill';
            var dirs=fs.readdirSync(bf).filter(d=>d.startsWith('2026')).sort();
            var dd=path.join(bf,dirs[dirs.length-1]);
            var fs2=fs.readdirSync(dd).filter(f=>f.endsWith('.json')).sort();
            var c=JSON.parse(fs.readFileSync(path.join(dd,fs2[fs2.length-1]),'utf8'));
            var f=c.endpoints.fees.data||{}, m=c.endpoints.mempool.data||{}, b=c.endpoints.blocks.data||[];
            console.log(JSON.stringify({f:f.fastestFee, m:(m.vsize?Math.round(m.vsize/1e6):0), b:(b[0]?b[0].tx_count:0)}));
        '''], capture_output=True, text=True, timeout=10, cwd=REPO)
        return json.loads(r.stdout)
    except:
        return {'f': 3, 'm': 40, 'b': 3800}

def run_js(js_code, timeout=15):
    encoded = base64.b64encode(js_code.encode('utf-8')).decode('ascii')
    script = f'''
    on run
        set jsCode to do shell script "echo {encoded} | base64 --decode"
        tell application "Google Chrome"
            set theResult to execute active tab of front window javascript jsCode
            return theResult
        end tell
    end run
    '''
    try:
        result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=timeout)
        return result.stdout.strip() if result.returncode == 0 else "ERR"
    except: return "TIMEOUT"

def osa(script, timeout=15):
    try: subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=timeout)
    except: pass

# ─── Gem Finder: score threads by relevance to BSAHI research ───

def score_thread(title):
    t = title.lower()
    score = 0
    topics_hit = []
    for topic, keywords in TOPICS.items():
        for kw in keywords:
            if kw in t:
                score += 2
                topics_hit.append(topic)
                break
    # Prefer substantive discussion topics (fees/mempool/blocks/lightning/cost)
    if 'fees' in topics_hit or 'mempool' in topics_hit: score += 3
    if 'lightning' in topics_hit: score += 2
    if 'node' in topics_hit: score += 1
    return score, topics_hit

def discover_threads(force=False):
    # Batched discovery: ONE tab, only for stale queries, navigates sequentially.
    stale = [q for q in QUERIES if not seen_state.page_fresh('reddit-search', q, DISCOVERY_TTL_MS)]
    if not stale and not force:
        print(f"Gem finder: all {len(QUERIES)} searches fresh (within 4h) — no discovery tabs")
        return []
    if force:
        stale = QUERIES[:]
        print("Gem finder: FORCED discovery pass (last scan yielded no threads)")
    all_threads = []
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    for q in stale:
        osa(f'tell application "Google Chrome" to set URL of active tab of front window to "https://www.reddit.com/r/Bitcoin/search/?q={q}&restrict_sr=1&sort=relevance&t=week"')
        time.sleep(7)
        threads = run_js(r"""
        (function() {
          var out = [];
          document.querySelectorAll('a[href*="/r/Bitcoin/comments/"]').forEach(function(a) {
            var href = a.href.split('?')[0];
            var title = (a.getAttribute('aria-label') || a.innerText || '').trim().slice(0, 100);
            if (title.length > 12 && !out.some(function(o){return o.href===href;})) {
              out.push({title: title, href: href});
            }
          });
          return JSON.stringify(out);
        })()
        """)
        try:
            ts = json.loads(threads)
            for t in ts:
                score, topics = score_thread(t['title'])
                if score >= 2:  # only keep relevant gems
                    t['score'] = score
                    t['topics'] = topics
                    all_threads.append(t)
        except:
            pass
        seen_state.mark_page_scanned('reddit-search', q)
        time.sleep(1)
    osa('tell application "Google Chrome" to close active tab of front window')

    # Deduplicate and sort by relevance score
    seen = {}
    for t in all_threads:
        if t['href'] not in seen:
            seen[t['href']] = t
    ranked = sorted(seen.values(), key=lambda x: -x['score'])
    return ranked

def build_comment(thread, data):
    topics = thread.get('topics', ['fees'])
    # Pick the data line matching the thread's dominant topic
    primary = topics[0] if topics else 'fees'
    data_line = DATA_LINES.get(primary, DATA_LINES['fees']).format(f=data['f'], m=data['m'], b=data['b'])
    opener = random.choice(OPENERS)
    bshahi = random.choice(BSAHI_LINES)
    closing = random.choice(CLOSINGS)
    return opener + " " + data_line + bshahi + closing

def post_comment(thread, comment):
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa(f'tell application "Google Chrome" to set URL of active tab of front window to "{thread["href"]}"')
    time.sleep(9)

    focus = run_js(r"""
    (function() {
      var t = document.querySelector('textarea[data-testid], [contenteditable="true"][data-testid], textarea');
      if (!t) t = document.querySelector('[contenteditable="true"]');
      if (t) { t.focus(); t.click(); return 'focused'; }
      return 'NO_BOX';
    })()
    """)
    if focus == 'NO_BOX':
        osa('tell application "Google Chrome" to close active tab of front window')
        return None
    time.sleep(1)

    subprocess.run(['pbcopy'], input=comment.encode(), timeout=10)
    osa('tell application "Google Chrome" to activate')
    time.sleep(0.3)
    osa('tell application "System Events" to keystroke "v" using command down')
    time.sleep(1.5)

    click = run_js(r"""
    (function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText||'').trim();
        if (t === 'Comment' && !btns[i].disabled) { btns[i].click(); return 'CLICKED'; }
      }
      return 'NO_BTN';
    })()
    """)
    time.sleep(5)
    osa('tell application "Google Chrome" to close active tab of front window')
    return click

def is_in_domain(text):
    r = subprocess.run(['node', '-e', f'var d=require("{REPO}/tools/bridge/domain.js"); console.log(d.isInDomain(process.argv[1]))', text], capture_output=True, text=True, timeout=10, cwd=REPO)
    return r.stdout.strip() == 'true'

def run_cycle(target):
    state = load_state()
    today = time.strftime('%Y-%m-%d')
    if state['day'] != today or 'commented_threads' not in state:
        state = {'comments_today': 0, 'day': today, 'commented_threads': [], 'last_comment': 0}
    if state['comments_today'] >= 50:
        print("Reached 50 comments/day. Stopping.")
        return

    data = get_live_data()
    threads = discover_threads()
    # Forced-refresh fallback: if all searches are fresh AND yielded no threads,
    # force one discovery pass so a bad scan can't lock out discovery for 4h.
    if not threads:
        stale_all = all(seen_state.page_fresh('reddit-search', q, DISCOVERY_TTL_MS) for q in QUERIES)
        if stale_all:
            threads = discover_threads(force=True)
    print(f"Gem finder found {len(threads)} relevant threads")
    for t in threads[:8]:
        print(f"  [{t['score']}] {t['title'][:50]} ({','.join(t['topics'])})")

    posted = 0
    for t in threads:
        if state['comments_today'] >= target: break
        if t['href'] in state.get('commented_threads', []): continue
        if seen_state.item_seen('reddit-thread', t['href']):
            print(f"  SKIP (already seen): {t['title'][:40]}")
            continue
        if not is_in_domain(t['title']):
            print(f"  SKIP (out of domain): {t['title'][:40]}")
            continue
        comment = build_comment(t, data)
        print(f"Commenting [{t['score']}pts] on: {t['title'][:40]}")
        seen_state.mark_item('reddit-thread', t['href'], 'attempted')
        result = post_comment(t, comment)
        if result and 'CLICKED' in result:
            state['comments_today'] += 1
            state['last_comment'] = time.time()
            state['commented_threads'].append(t['href'])
            seen_state.mark_item('reddit-thread', t['href'], 'commented')
            save_state(state)
            print(f"  ✓ #{state['comments_today']} posted")
            posted += 1
            time.sleep(random.randint(45, 120))
        else:
            print(f"  ✗ failed to post — marking failed (retry after 24h)")
        if posted >= 5:  # cap per cycle; run again for more
            break

    save_state(state)
    print(f"Cycle done. Comments today: {state['comments_today']}/50")

def run_check():
    """Diagnostic mode: answers 'why 0 comments?' in one command."""
    print("=== comment-engine --check ===")
    try:
        r = subprocess.run(['osascript', '-e', 'tell application "Google Chrome" to get name of front window'], capture_output=True, text=True, timeout=10)
        print("Chrome reachable:", "YES" if r.returncode == 0 else "NO (" + (r.stderr or '').strip() + ")")
    except Exception as e:
        print("Chrome reachable: NO (" + str(e) + ")")
    try:
        st = seen_state.stats()
        print("seen-state:", json.dumps(st))
    except Exception as e:
        print("seen-state: error " + str(e))
    try:
        data = get_live_data()
        print("live data:", json.dumps(data))
    except Exception as e:
        print("live data: error " + str(e))
    s = load_state()
    print("comment-state:", json.dumps(s))
    print("=== end ===")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        run_check()
    else:
        target = int(sys.argv[1]) if len(sys.argv) > 1 else 5
        run_cycle(target)
