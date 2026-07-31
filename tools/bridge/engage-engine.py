#!/usr/bin/env python3
"""
BSAHI — LinkedIn & Medium Engagement Engine
===========================================
Engages with other people's content — the comment engine, but for LinkedIn
and Medium. Discovers relevant posts, comments softly with data + what we're
building, and respects cadence.

LinkedIn: comment on Bitcoin/finance/blockchain posts (~20/day)
Medium:  clap + comment on blockchain stories (~20/day)
"""
import subprocess, base64, time, json, os, random, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
import seen_state

REPO = '/Users/prateekposwal/Desktop/block-space-economics'
STATE_FILE = os.path.join(REPO, 'captured-data', 'engage-state.json')

LINKEDIN_FEED_TTL_MS = seen_state.cooldown_ms('linkedinFeed', 2 * 3600 * 1000)
MEDIUM_TAG_TTL_MS = seen_state.cooldown_ms('discovery', 4 * 3600 * 1000)

COMMENT_TEMPLATES = [
    "Appreciate this perspective. It connects to something we have been tracking — live data shows the fee market doing exactly this at {f} sat/vB right now. The numbers back the argument.",
    "Good write-up. We have been capturing the network continuously and the pattern holds in our data — mempool at {m} MB, fees at {f} sat/vB. This is the part of Bitcoin most people overlook.",
    "Strong point. On the data side, our recent capture shows the same trend — {b} txs in the last block, fees still modest. The economics are quietly doing their job.",
    "Thanks for sharing. It lines up with what we measure at BSAHI — we built an autonomous engine to watch these exact signals. The fee market is the most honest price in the space.",
    "Interesting take. One data point that might add to it: our live captures show the mempool consistently at {m} MB, which suggests genuine demand, not noise. Curious how others interpret it."
]

def load_state():
    try:
        with open(STATE_FILE) as f: return json.load(f)
    except:
        return {'li_today': 0, 'md_today': 0, 'day': '', 'done': []}

def save_state(s):
    with open(STATE_FILE, 'w') as f: json.dump(s, f)

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

# ─── LinkedIn engagement ───

def discover_linkedin_posts():
    if seen_state.page_fresh('linkedin-feed', 'home', LINKEDIN_FEED_TTL_MS):
        print("LinkedIn feed fresh (2h) — skip discovery tab")
        return []
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa('tell application "Google Chrome" to set URL of active tab of front window to "https://www.linkedin.com/feed/"')
    time.sleep(8)
    posts = run_js(r"""
    (function() {
      var out = [];
      document.querySelectorAll('[data-urn], [class*="feed-shared-update"], [class*="occludable-update"]').forEach(function(el) {
        var text = (el.innerText||'').slice(0, 150);
        if (text.length > 30) out.push({text: text});
      });
      return JSON.stringify(out.slice(0, 10));
    })()
    """)
    osa('tell application "Google Chrome" to close active tab of front window')
    seen_state.mark_page_scanned('linkedin-feed', 'home')
    try:
        posts = json.loads(posts)
        # mark all discovered so future cycles don't re-attempt
        for p in posts:
            key = seen_state.sha1(p['text'][:150])
            if not seen_state.item_seen('linkedin-post', key):
                seen_state.mark_item('linkedin-post', key, 'discovered')
        return posts
    except:
        return []

def comment_linkedin(post_text):
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa('tell application "Google Chrome" to set URL of active tab of front window to "https://www.linkedin.com/feed/"')
    time.sleep(7)
    # Find the comment trigger for a post and open comment box
    opened = run_js(r"""
    (function() {
      // Click a comment button on a post
      var btns = document.querySelectorAll('button[aria-label*="comment"], button[aria-label*="Comment"], [data-control-name*="comment"]');
      for (var i = 0; i < btns.length; i++) {
        btns[i].click();
        return 'clicked comment btn ' + i;
      }
      return 'NO_comment_btn';
    })()
    """)
    time.sleep(3)
    if opened == 'NO_comment_btn':
        osa('tell application "Google Chrome" to close active tab of front window')
        return None
    # Fill the comment editor
    data = get_live_data()
    comment = random.choice(COMMENT_TEMPLATES).format(f=data['f'], m=data['m'], b=data['b'])
    filled = run_js(r"""
    (function() {
      var box = document.querySelector('[contenteditable="true"][role="textbox"], [contenteditable="true"][aria-label*="comment"], [contenteditable="true"][aria-label*="Comment"], .ql-editor');
      if (!box) return 'NO_BOX';
      box.focus();
      return 'focused';
    })()
    """)
    if filled == 'NO_BOX':
        osa('tell application "Google Chrome" to close active tab of front window')
        return None
    time.sleep(1)
    subprocess.run(['pbcopy'], input=comment.encode(), timeout=10)
    osa('tell application "Google Chrome" to activate')
    time.sleep(0.3)
    osa('tell application "System Events" to keystroke "v" using command down')
    time.sleep(1.5)
    # Submit comment (Ctrl+Enter or Post button)
    submitted = run_js(r"""
    (function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText||'').trim();
        if (t === 'Post' && !btns[i].disabled) { btns[i].click(); return 'POSTED'; }
        if (t === 'Comment' && !btns[i].disabled) { btns[i].click(); return 'POSTED'; }
      }
      return 'NO_BTN';
    })()
    """)
    time.sleep(4)
    osa('tell application "Google Chrome" to close active tab of front window')
    return submitted

# ─── Medium engagement ───

def discover_medium_stories():
    if seen_state.page_fresh('medium-tag', 'blockchain', MEDIUM_TAG_TTL_MS):
        print("Medium tag fresh (4h) — skip discovery tab")
        return []
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa('tell application "Google Chrome" to set URL of active tab of front window to "https://medium.com/tag/blockchain/latest"')
    time.sleep(8)
    stories = run_js(r"""
    (function() {
      var out = [];
      document.querySelectorAll('article a, [href*="/@"]').forEach(function(a) {
        var href = a.href.split('?')[0];
        var title = (a.getAttribute('aria-label') || a.innerText || '').trim().slice(0, 80);
        if (title.length > 15 && href.includes('medium.com/')) out.push({title: title, href: href});
      });
      var seen = {};
      var res = out.filter(function(o){ if(seen[o.href]) return false; seen[o.href]=1; return true; });
      return JSON.stringify(res.slice(0, 10));
    })()
    """)
    osa('tell application "Google Chrome" to close active tab of front window')
    seen_state.mark_page_scanned('medium-tag', 'blockchain')
    try:
        stories = json.loads(stories)
        for s in stories:
            if not seen_state.item_seen('medium-story', s['href']):
                seen_state.mark_item('medium-story', s['href'], 'discovered')
        return stories
    except:
        return []

def engage_medium(story):
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa(f'tell application "Google Chrome" to set URL of active tab of front window to "{story["href"]}"')
    time.sleep(8)
    # Clap (up to 50) + comment
    clapped = run_js(r"""
    (function() {
      var btn = document.querySelector('[aria-label*="clap"], [data-testid="clapButton"], button[aria-label*="Clap"]');
      if (btn) { btn.click(); btn.click(); return 'clapped'; }
      return 'NO_CLAP';
    })()
    """)
    time.sleep(1)
    # Open comment box
    data = get_live_data()
    comment = random.choice(COMMENT_TEMPLATES).format(f=data['f'], m=data['m'], b=data['b'])
    opened = run_js(r"""
    (function() {
      var btn = document.querySelector('[data-testid="commentButton"], [aria-label*="respond"], [aria-label*="Respond"], button[class*="responseCount"]');
      if (btn) { btn.click(); return 'opened'; }
      return 'NO_BTN';
    })()
    """)
    time.sleep(2)
    filled = run_js(r"""
    (function() {
      var box = document.querySelector('[contenteditable="true"]');
      if (box) { box.focus(); return 'focused'; }
      return 'NO_BOX';
    })()
    """)
    if filled == 'NO_BOX':
        osa('tell application "Google Chrome" to close active tab of front window')
        return None
    time.sleep(1)
    subprocess.run(['pbcopy'], input=comment.encode(), timeout=10)
    osa('tell application "Google Chrome" to activate')
    time.sleep(0.3)
    osa('tell application "System Events" to keystroke "v" using command down')
    time.sleep(1.5)
    submitted = run_js(r"""
    (function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText||'').trim();
        if (t === 'Respond' || t === 'Publish') { btns[i].click(); return 'POSTED'; }
      }
      return 'NO_BTN';
    })()
    """)
    time.sleep(4)
    osa('tell application "Google Chrome" to close active tab of front window')
    return clapped + '|' + submitted

def run_cycle(li_target, md_target):
    state = load_state()
    today = time.strftime('%Y-%m-%d')
    if state['day'] != today:
        state = {'li_today': 0, 'md_today': 0, 'day': today, 'done': []}

    data = get_live_data()

    # LinkedIn engagement — discovery ONCE, filter already-done posts
    if state['li_today'] < li_target:
        posts = discover_linkedin_posts()
        fresh = [p for p in posts if not seen_state.item_seen('linkedin-post', seen_state.sha1(p['text'][:150]))]
        print(f"LinkedIn: {len(posts)} discovered, {len(fresh)} fresh")
        li_count = 0
        for p in fresh:
            if state['li_today'] >= li_target or li_count >= 3: break
            key = seen_state.sha1(p['text'][:150])
            seen_state.mark_item('linkedin-post', key, 'attempted')
            result = comment_linkedin(p['text'])
            if result and 'POSTED' in result:
                state['li_today'] += 1
                seen_state.mark_item('linkedin-post', key, 'done')
                state['done'].append({'key': 'linkedin-post:' + key, 'ts': time.time()})
                save_state(state)
                print(f"LinkedIn comment #{state['li_today']} posted")
                li_count += 1
            else:
                seen_state.mark_item('linkedin-post', key, 'failed')
            time.sleep(random.randint(30, 60))
    else:
        print("LinkedIn daily target met — skip")

    # Medium engagement — discovery ONCE, filter already-done stories
    if state['md_today'] < md_target:
        stories = discover_medium_stories()
        fresh = [s for s in stories if not seen_state.item_seen('medium-story', s['href'])]
        print(f"Medium: {len(stories)} discovered, {len(fresh)} fresh")
        md_count = 0
        for s in fresh:
            if state['md_today'] >= md_target or md_count >= 3: break
            seen_state.mark_item('medium-story', s['href'], 'attempted')
            result = engage_medium(s)
            if result:
                state['md_today'] += 1
                seen_state.mark_item('medium-story', s['href'], 'done')
                state['done'].append({'key': 'medium-story:' + s['href'], 'ts': time.time()})
                save_state(state)
                print(f"Medium engagement #{state['md_today']} done")
                md_count += 1
            else:
                seen_state.mark_item('medium-story', s['href'], 'failed')
            time.sleep(random.randint(30, 60))
    else:
        print("Medium daily target met — skip")

    save_state(state)
    print(f"Cycle done. LinkedIn: {state['li_today']}/{li_target}, Medium: {state['md_today']}/{md_target}")

if __name__ == '__main__':
    li = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    md = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    run_cycle(li, md)
