#!/usr/bin/env python3
"""
BSAHI — Reddit Poster (Brain-Teaser Method)
===========================================
The technique that cracked Reddit's ProseMirror editor:

1. TITLE: focus textarea (shadow DOM) → real selection → beforeinput(insertText)
          → execCommand('insertText') → input+change events
2. BODY:  focus contenteditable → create REAL Range/Selection in the <p>
          → dispatch beforeinput(insertText) [ProseMirror consumes it]
          → execCommand('insertText')
3. POST:  find the <button> whose textContent === 'Post' (it lives in a
          shadow root — scan every shadow root) → click()

Lesson from Ravi Narula's Brain Teasers: "Defy the default assumption."
Don't fight the editor — give it exactly the input mechanism it consumes.
"""
import subprocess, base64, time, sys

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

TITLE = 'BSAHI: Bitcoin Block Space Research - Live Data'
BODY = ("Bitcoin's blocks are full by design. At $68K average transaction value, "
        "Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. "
        "Live data at bitcoinsahi.com")

def post(subreddit='r/Bitcoin', title=TITLE, body=BODY):
    osa(f'tell application "Google Chrome" to make new tab at end of tabs of front window')
    time.sleep(1)
    osa(f'tell application "Google Chrome" to set URL of active tab of front window to "https://www.reddit.com/{subreddit}/submit"')
    time.sleep(10)

    # 1. Title
    print("Title:", run_js(fr"""
(function() {{
  var comp = document.querySelector('post-composer-title');
  var t = comp ? (comp.shadowRoot || comp).querySelector('textarea') : null;
  if (!t) return 'NO_TITLE';
  t.focus();
  t.select();
  var text = {title!r};
  t.dispatchEvent(new InputEvent('beforeinput', {{ bubbles:true, cancelable:true, inputType:'insertText', data:text }}));
  document.execCommand('insertText', false, text);
  t.dispatchEvent(new Event('input', {{ bubbles:true }}));
  t.dispatchEvent(new Event('change', {{ bubbles:true }}));
  return 'ok val=' + t.value.slice(0,15);
}})()
"""))
    time.sleep(1)

    # 2. Body
    print("Body:", run_js(fr"""
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
  var text = {body!r};
  body.dispatchEvent(new InputEvent('beforeinput', {{ bubbles:true, cancelable:true, inputType:'insertText', data:text }}));
  document.execCommand('insertText', false, text);
  return 'ok text=' + body.textContent.trim().slice(0,15);
}})()
"""))
    time.sleep(2)

    # 3. Click Post (scan shadow roots for the exact button)
    print("Click:", run_js(r"""
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
  var disabled = btn.disabled;
  btn.click();
  return 'CLICKED disabled=' + disabled;
})()
"""))
    time.sleep(12)
    result = run_js("document.title + '||' + location.href")
    print("Result:", result)
    return result

if __name__ == '__main__':
    sub = sys.argv[1] if len(sys.argv) > 1 else 'r/Bitcoin'
    post(sub)
