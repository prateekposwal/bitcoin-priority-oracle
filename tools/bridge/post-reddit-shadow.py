#!/usr/bin/env python3
import subprocess, base64, time

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
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=timeout)
    return result.stdout.strip() if result.returncode == 0 else f"ERROR: {result.stderr.strip()[:80]}"

def keystroke(text):
    safe = text.replace('\\', '\\\\').replace('"', '\\"')
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome" to activate
    delay 0.2
    tell application "System Events"
        keystroke "{safe}"
    end tell'''], capture_output=True, text=True, timeout=20)

# Set title by piercing shadow DOM
title_js = r"""
(function() {
  try {
    var comp = document.querySelector('post-composer-title');
    if (!comp) return 'no composer-title component';
    var sr = comp.shadowRoot || comp;
    var title = sr.querySelector('textarea[name="title"], textarea, input');
    if (!title) return 'no textarea in shadow';
    title.focus();
    var proto = title.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(title, 'BSAHI: Bitcoin Block Space Research - Live Data');
    title.dispatchEvent(new Event('input', {bubbles: true}));
    title.dispatchEvent(new Event('change', {bubbles: true}));
    return 'TITLE SET: ' + title.value;
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
print("Title:", run_js(title_js))
time.sleep(1)

# Focus body and type
focus_body = r"""
(function() {
  var body = document.querySelector('div[aria-label="Post body text field"]');
  if (body) { body.focus(); body.click(); return 'focused'; }
  return 'no body';
})()
"""
print("Focus body:", run_js(focus_body))
time.sleep(0.5)
keystroke("Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com")
time.sleep(1)

# Verify
print("Verify:", run_js(r"""
(function() {
  var comp = document.querySelector('post-composer-title');
  var title = comp ? (comp.shadowRoot || comp).querySelector('textarea, input') : null;
  var body = document.querySelector('div[aria-label="Post body text field"]');
  return 'title=' + (title ? title.value : 'none') + ' body=' + (body ? body.textContent.trim().slice(0,20) : 'none');
})()
"""))

# Find Post
print("Post:", run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('button').forEach(function(b) {
    var t = (b.textContent || '').trim();
    var aria = (b.getAttribute('aria-label') || '');
    if (t.toLowerCase() === 'post' || aria.toLowerCase() === 'post') out.push('disabled=' + b.disabled);
  });
  return out.join('|') || 'NONE';
})()
"""))

# Click Post
print("Click:", run_js(r"""
(function() {
  var btns = document.querySelectorAll('button');
  for (var i = 0; i < btns.length; i++) {
    var t = (btns[i].textContent || '').trim().toLowerCase();
    var aria = (btns[i].getAttribute('aria-label') || '').toLowerCase();
    if ((t === 'post' || aria === 'post') && !btns[i].disabled) { btns[i].click(); return 'CLICKED'; }
  }
  return 'not clickable';
})()
"""))
time.sleep(7)
print("After:", run_js("document.title + '|' + location.href"))
