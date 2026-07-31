#!/usr/bin/env python3
"""
BSAHI — Compliant Cross-Platform Poster
=======================================
Posts genuine, substantive Bitcoin analysis (generated from real captured data)
to Reddit and LinkedIn using the brain-teaser browser technique.

Compliance rules enforced:
- Substantive in-post analysis (not link drops)
- Natural cadence (no spam bursts) — enforced by compliant-content.js
- Platform-native formatting
- Logs every post
"""
import subprocess, base64, time, sys, json, os

REPO = '/Users/prateekposwal/Desktop/block-space-economics'

def osa(script, timeout=30):
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=timeout)
    return result.stdout.strip() if result.returncode == 0 else f"ERR"

def run_js(js_code, timeout=30):
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
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=timeout)
    return result.stdout.strip() if result.returncode == 0 else f"ERR: {result.stderr.strip()[:60]}"

def get_compliant_content(platform):
    r = subprocess.run(['node', os.path.join(REPO, 'tools/bridge/compliant-content.js'), platform],
                       capture_output=True, text=True, timeout=15, cwd=REPO)
    try:
        return json.loads(r.stdout)
    except:
        return None

def check_cadence(platform):
    # Quick cadence check via the content module
    r = subprocess.run(['node', '-e',
        f'var c = require("{REPO}/tools/bridge/compliant-content.js"); console.log(JSON.stringify(c.canPost("{platform}")))'],
        capture_output=True, text=True, timeout=15, cwd=REPO)
    try:
        return json.loads(r.stdout)
    except:
        return {'ok': False, 'nextPostMs': 86400000}

def record_post(platform, url):
    subprocess.run(['node', '-e',
        f'var c = require("{REPO}/tools/bridge/compliant-content.js"); c.recordPost("{platform}", "{url}")'],
        capture_output=True, text=True, timeout=15, cwd=REPO)

# ─── Reddit (brain-teaser technique + compliant content) ───

def post_reddit(title, body):
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa('tell application "Google Chrome" to set URL of active tab of front window to "https://www.reddit.com/r/Bitcoin/submit"')
    time.sleep(10)

    # Title via selection + beforeinput + execCommand
    title_js = f"""
    (function() {{
      var comp = document.querySelector('post-composer-title');
      var t = comp ? (comp.shadowRoot || comp).querySelector('textarea') : null;
      if (!t) return 'NO_TITLE';
      t.focus();
      t.select();
      var text = {json.dumps(title)};
      t.dispatchEvent(new InputEvent('beforeinput', {{ bubbles:true, cancelable:true, inputType:'insertText', data:text }}));
      document.execCommand('insertText', false, text);
      t.dispatchEvent(new Event('input', {{ bubbles:true }}));
      t.dispatchEvent(new Event('change', {{ bubbles:true }}));
      return 'ok';
    }})()
    """
    print("Title:", run_js(title_js))
    time.sleep(1)

    # Body via real selection + beforeinput
    body_js = f"""
    (function() {{
      var body = document.querySelector('div[aria-label="Post body text field"]');
      if (!body) return 'NO_BODY';
      body.focus();
      var p = body.querySelector('p') || body;
      var tn = p.firstChild || document.createTextNode('');
      if (!p.firstChild) p.appendChild(tn);
      var r = document.createRange();
      r.setStart(tn, 0); r.collapse(true);
      var s = window.getSelection();
      s.removeAllRanges(); s.addRange(r);
      var text = {json.dumps(body)};
      body.dispatchEvent(new InputEvent('beforeinput', {{ bubbles:true, cancelable:true, inputType:'insertText', data:text }}));
      document.execCommand('insertText', false, text);
      return 'ok';
    }})()
    """
    print("Body:", run_js(body_js))
    time.sleep(2)

    # Click Post (scan shadow roots)
    click = run_js(r"""
    (function() {
      var btn = null;
      function scan(root) {
        if (!root) return;
        var all = root.querySelectorAll('*');
        for (var i = 0; i < all.length; i++) {
          var el = all[i];
          if (el.tagName === 'BUTTON' && (el.textContent||'').trim() === 'Post') { btn = el; return; }
          if (el.shadowRoot) scan(el.shadowRoot);
        }
      }
      scan(document);
      if (!btn) return 'NOT_FOUND';
      btn.click();
      return 'CLICKED';
    })()
    """)
    print("Click:", click)
    time.sleep(12)
    result = run_js("location.href")
    osa('tell application "Google Chrome" to close active tab of front window')
    return result

# ─── LinkedIn ───

def post_linkedin(body):
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa('tell application "Google Chrome" to set URL of active tab of front window to "https://www.linkedin.com/feed/"')
    time.sleep(8)

    # Open composer
    open_js = r"""
    (function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '');
        if (t.includes('Start a post')) { btns[i].click(); return 'opened'; }
      }
      return 'no btn';
    })()
    """
    print("Open:", run_js(open_js))
    time.sleep(3)

    # Fill editor via real selection + beforeinput
    body_js = f"""
    (function() {{
      var editor = document.querySelector('[contenteditable="true"][role="textbox"], .ql-editor, [data-placeholder*="post"]');
      if (!editor) return 'NO_EDITOR';
      editor.focus();
      var text = {json.dumps(body)};
      editor.dispatchEvent(new InputEvent('beforeinput', {{ bubbles:true, cancelable:true, inputType:'insertText', data:text }}));
      document.execCommand('insertText', false, text);
      return 'ok';
    }})()
    """
    print("Fill:", run_js(body_js))
    time.sleep(2)

    # Click Post
    click = run_js(r"""
    (function() {
      var btns = document.querySelectorAll('button');
      for (var i = 0; i < btns.length; i++) {
        var t = (btns[i].innerText || '').trim();
        if (t === 'Post' && !btns[i].disabled) { btns[i].click(); return 'CLICKED'; }
      }
      return 'NOT_CLICKABLE';
    })()
    """)
    print("Click:", click)
    time.sleep(8)
    result = run_js("location.href")
    osa('tell application "Google Chrome" to close active tab of front window')
    return result

def post_medium(title, body):
    osa('tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa('tell application "Google Chrome" to set URL of active tab of front window to "https://medium.com/new-story"')
    time.sleep(8)

    # Fill the editor (title + body) via real selection + beforeinput
    fill_js = f"""
    (function() {{
      var editor = document.querySelector('[contenteditable="true"]');
      if (!editor) return 'NO_EDITOR';
      editor.focus();
      var title = {json.dumps(title)};
      var body = {json.dumps(body)};
      editor.dispatchEvent(new InputEvent('beforeinput', {{ bubbles:true, cancelable:true, inputType:'insertText', data:title }}));
      document.execCommand('insertText', false, title);
      // newline + body
      editor.dispatchEvent(new InputEvent('beforeinput', {{ bubbles:true, cancelable:true, inputType:'insertParagraph', data:null }}));
      document.execCommand('insertText', false, body);
      return 'filled';
    }})()
    """
    print("Fill:", run_js(fill_js))
    time.sleep(2)
    # Close tab (Medium has more complex publish flow; leave draft)
    result = run_js("location.href")
    osa('tell application "Google Chrome" to close active tab of front window')
    return result


def main():
    platform = sys.argv[1] if len(sys.argv) > 1 else 'reddit'
    cadence = check_cadence(platform)
    if not cadence.get('ok'):
        print(f"Cadence block: next post in {cadence.get('nextPostMs',0)/3600000:.1f}h (today: {cadence.get('postsToday',0)})")
        return

    content = get_compliant_content(platform)
    if not content:
        print("No compliant content available")
        return

    print(f"Posting to {platform}...")
    if platform == 'reddit':
        url = post_reddit(content['title'], content['body'])
        if url and 'reddit.com' in url:
            record_post('reddit', url)
            print("Posted:", url)
        else:
            print("Result:", url)
    elif platform == 'linkedin':
        url = post_linkedin(content['body'])
        if 'linkedin.com/feed' in str(url):
            record_post('linkedin', url)
            print("Posted to LinkedIn")
        else:
            print("Result:", url)
    elif platform == 'medium':
        url = post_medium(content['title'], content['body'])
        if 'medium.com' in str(url):
            record_post('medium', url)
            print("Medium draft created")
        else:
            print("Result:", url)

if __name__ == '__main__':
    main()
