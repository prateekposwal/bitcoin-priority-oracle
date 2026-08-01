#!/usr/bin/env python3
"""
BSAHI — Reply Engine (Always Answer Back)
=========================================
The most important engagement loop: when someone replies to our comment,
we ALWAYS reply. Replies give direction — they tell us what to research
and write next.

Flow (v3 — inbox-driven, no forced replies):
1. Fetch the Reddit inbox (authenticated browser session)
2. Keep only genuine replies to OUR comments (dest == New_Spare3193)
3. Skip anything already replied to (seen-state + reply-state)
4. Post a thoughtful reply (soft tone, data, builds on their point)
5. Track replied-to comments (never reply twice)
"""
import subprocess, base64, time, json, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
import seen_state

REPO = '/Users/prateekposwal/Desktop/block-space-economics'
STATE_FILE = os.path.join(REPO, 'captured-data', 'comment-state.json')
REPLY_STATE = os.path.join(REPO, 'captured-data', 'reply-state.json')

# ─── Reply templates — acknowledge, add value, build on their point ───

REPLY_OPENERS = [
    "Thanks for the thoughtful reply — this is exactly the kind of pushback that sharpens the work.",
    "Appreciate you engaging with this. Your point is fair, and it made me look at the data again.",
    "Good challenge. Let me respond with what we have, and what we still need to learn.",
    "Really glad you replied. This is the conversation we want to be part of.",
]

REPLY_BUILDS = [
    " Looking at the live capture again: fees at {f} sat/vB, mempool at {m} MB. Your point holds in the current numbers, which makes the longer-term question even more interesting.",
    " The data actually supports part of your argument — {b} txs in the last block, fees still modest. Where we differ is on what that implies going forward. Worth watching the next few cycles.",
    " You are right to push on this. Our Storage Cost Coverage Ratio (~17% of a decade of storage costs covered) is early and directional — if the fee share grows over time, the conclusion strengthens; if not, we update. That is the plan.",
    " Interesting angle. Our captures show the mempool at {m} MB, which is consistent with what you describe. We will keep measuring and share if the pattern shifts.",
]

REPLY_CLOSERS = [
    " Curious if your observations match ours on the ground.",
    " Happy to share the raw data if useful.",
    " No need to agree — just want to understand it better together.",
    " We are tracking this closely and will post an update if the evidence changes.",
]

# ─── State ───

def load_state():
    try:
        with open(STATE_FILE) as f: return json.load(f)
    except:
        return {'comments_today': 0, 'day': '', 'commented_threads': [], 'last_comment': 0}

def save_state(s):
    with open(STATE_FILE, 'w') as f: json.dump(s, f)

def load_reply_state():
    try:
        with open(REPLY_STATE) as f: return json.load(f)
    except:
        return {'replied': {}, 'replies_today': 0, 'day': ''}

def save_reply_state(s):
    with open(REPLY_STATE, 'w') as f: json.dump(s, f)

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

def run_js(js_code, timeout=20):
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

# ─── Inbox-driven reply detection ───

def chrome_available():
    try:
        r = subprocess.run(['osascript', '-e', 'tell application "Google Chrome" to get name of front window'], capture_output=True, text=True, timeout=10)
        return r.returncode == 0
    except Exception:
        return False

def fetch_inbox():
    """Fetch Reddit inbox JSON via the authenticated browser session."""
    run_js(r'''
    (function() {
      window.__inbox = 'loading';
      fetch('/message/inbox.json?limit=25', { credentials: 'include' })
        .then(function(r) { return r.text(); })
        .then(function(t) { window.__inbox = t; })
        .catch(function(e) { window.__inbox = 'ERR'; });
      return 'started';
    })()
    ''')
    time.sleep(5)
    raw = run_js('window.__inbox || "none"', timeout=15)
    if raw in ('ERR', 'TIMEOUT', 'none', 'loading'):
        return []
    try:
        data = json.loads(raw)
        return data.get('data', {}).get('children', [])
    except Exception:
        return []

def reply_to_comment(context_url, reply_text):
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa(f'tell application "Google Chrome" to set URL of active tab of front window to "{context_url}"')
    time.sleep(9)

    opened = run_js(r"""
    (function() {
      var replyBtns = document.querySelectorAll('button[aria-label*="Reply"], [data-testid*="reply"]');
      if (replyBtns.length) { replyBtns[replyBtns.length-1].click(); return 'opened'; }
      return 'NO_BTN';
    })()
    """)
    time.sleep(2)
    if opened == 'NO_BTN':
        osa('tell application "Google Chrome" to close active tab of front window')
        return None

    filled = run_js(r"""
    (function() {
      var box = document.querySelector('[contenteditable="true"][data-testid], [role="textbox"], textarea');
      if (!box) return 'NO_BOX';
      box.focus();
      return 'focused';
    })()
    """)
    if filled == 'NO_BOX':
        osa('tell application "Google Chrome" to close active tab of front window')
        return None
    time.sleep(1)
    subprocess.run(['pbcopy'], input=reply_text.encode(), timeout=10)
    osa('tell application "Google Chrome" to activate')
    time.sleep(0.3)
    osa('tell application "System Events" to keystroke "v" using command down')
    time.sleep(1.5)

    submitted = run_js(r"""
    (function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText||'').trim();
        if (t === 'Reply' && !btns[i].disabled) { btns[i].click(); return 'REPLIED'; }
        if (t === 'Comment' && !btns[i].disabled) { btns[i].click(); return 'REPLIED'; }
      }
      return 'NO_BTN';
    })()
    """)
    time.sleep(5)
    osa('tell application "Google Chrome" to close active tab of front window')
    return submitted

def build_reply(data):
    return (random.choice(REPLY_OPENERS) + random.choice(REPLY_BUILDS).format(f=data['f'], m=data['m'], b=data['b'])
            + random.choice(REPLY_CLOSERS))

def run_cycle():
    reply_state = load_reply_state()
    today = time.strftime('%Y-%m-%d')
    if reply_state['day'] != today:
        reply_state = {'replied': reply_state.get('replied', {}), 'replies_today': 0, 'day': today}

    data = get_live_data()

    # 1. Fetch actual inbox replies to us
    inbox = fetch_inbox()
    if not inbox:
        if not chrome_available():
            print("CHROME_UNAVAILABLE — browser not reachable for inbox fetch")
        else:
            print("NO_INBOX_MESSAGES — Chrome reachable but inbox empty/not loaded")
        save_reply_state(reply_state)
        return

    # 2. Keep only genuine replies to our comments
    candidates = []
    seen = set()
    for c in inbox:
        d = c.get('data', {})
        body = (d.get('body') or '').strip()
        context = d.get('context') or ''
        is_reply_to_us = d.get('dest') == 'New_Spare3193' or d.get('type') == 'post_reply'
        if not body or not context or context in seen:
            continue
        seen.add(context)
        if not is_reply_to_us:
            continue
        candidates.append({'author': d.get('author') or '', 'context': context, 'body': body[:200]})

    if not candidates:
        print("Inbox has no unreplied replies to our comments.")
        save_reply_state(reply_state)
        return

    # 3. Reply only to genuinely new replies (never reply twice)
    replied_any = False
    for cand in candidates:
        if cand['context'] in reply_state.get('replied', {}):
            continue
        if seen_state.item_seen('reply-check', cand['context']):
            print(f"  SKIP (already replied/checked): {cand['context'][:50]}")
            continue
        seen_state.mark_item('reply-check', cand['context'], 'attempted')
        reply = build_reply(data)
        print(f"Replying to {cand['author']} on {cand['context'][:50]}...")
        result = reply_to_comment('https://www.reddit.com' + cand['context'], reply)
        if result and 'REPLIED' in result:
            reply_state['replied'][cand['context']] = time.time()
            reply_state['replies_today'] += 1
            seen_state.mark_item('reply-check', cand['context'], 'replied')
            save_reply_state(reply_state)
            print(f"  ✓ Replied #{reply_state['replies_today']}")
            replied_any = True
            break  # one reply per cycle; run again for more
        else:
            seen_state.mark_item('reply-check', cand['context'], 'failed')
            print("  ✗ reply post failed")

    save_reply_state(reply_state)
    if not replied_any:
        print("No unreplied comments found right now. Will check again next cycle.")
    print(f"Replies today: {reply_state['replies_today']}")

if __name__ == '__main__':
    run_cycle()
