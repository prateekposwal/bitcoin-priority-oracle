#!/usr/bin/env python3
import subprocess, base64, time, sys

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
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=timeout)
    if result.returncode != 0:
        return "OSERR"
    return result.stdout.strip()

def clear_dialogs():
    subprocess.run(['osascript', '-e', '''
    tell application "System Events"
        tell process "Google Chrome"
            set frontmost to true
            key code 53
        end tell
    end tell'''], capture_output=True, text=True, timeout=10)

def set_url(url):
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome"
        set URL of active tab of front window to "{url}"
    end tell'''], capture_output=True, text=True, timeout=30)

def main():
    clear_dialogs()
    set_url("https://www.reddit.com/r/Bitcoin/submit")
    time.sleep(10)
    clear_dialogs()

    # Wait for the composer to be ready
    for attempt in range(5):
        ready = run_js("(document.querySelector('post-composer-title') ? 'ready' : 'not-ready')")
        print(f"Wait {attempt}: {ready}")
        if ready == "ready":
            break
        time.sleep(3)

    # Set title
    title_result = run_js(r"""
(function() {
  var comp = document.querySelector('post-composer-title');
  if (!comp) return 'NO-COMP';
  var sr = comp.shadowRoot || comp;
  var t = sr.querySelector('textarea');
  if (!t) return 'NO-TEXTAREA';
  t.focus();
  var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(t, 'BSAHI: Bitcoin Block Space Research - Live Data');
  t.dispatchEvent(new Event('input', {bubbles:true}));
  t.dispatchEvent(new Event('change', {bubbles:true}));
  return 'TITLE-OK:' + t.value.slice(0,20);
})()
""")
    print("Title:", title_result)
    time.sleep(1)

    # Focus body
    focus_result = run_js(r"""
(function() {
  var body = document.querySelector('div[aria-label="Post body text field"]');
  if (body) { body.focus(); return 'FOCUSED'; }
  return 'NO-BODY';
})()
""")
    print("Focus:", focus_result)
    time.sleep(0.5)

    # Type body via keystroke (worked before)
    safe = "Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com"
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome" to activate
    delay 0.3
    tell application "System Events"
        keystroke "{safe}"
    end tell'''], capture_output=True, text=True, timeout=25)
    time.sleep(1)

    # Verify
    verify = run_js(r"""
(function() {
  var comp = document.querySelector('post-composer-title');
  var t = comp ? (comp.shadowRoot || comp).querySelector('textarea') : null;
  var body = document.querySelector('div[aria-label="Post body text field"]');
  return 'T=[' + (t ? t.value : 'none') + '] B=[' + (body ? body.textContent.trim().slice(0,25) : 'none') + ']';
})()
""")
    print("Verify:", verify)

    # Find Post button
    btn = run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('button').forEach(function(b) {
    var t = (b.textContent || '').trim();
    var aria = (b.getAttribute('aria-label') || '');
    if (t.toLowerCase() === 'post' || aria.toLowerCase() === 'post') out.push('d=' + b.disabled);
  });
  return out.join('|') || 'NONE';
})()
""")
    print("Post btn:", btn)

    # Click Post
    click = run_js(r"""
(function() {
  var btns = document.querySelectorAll('button');
  for (var i = 0; i < btns.length; i++) {
    var t = (btns[i].textContent || '').trim().toLowerCase();
    var aria = (btns[i].getAttribute('aria-label') || '').toLowerCase();
    if ((t === 'post' || aria === 'post') && !btns[i].disabled) {
      btns[i].click();
      return 'CLICKED';
    }
  }
  return 'NOT-CLICKABLE';
})()
""")
    print("Click:", click)
    time.sleep(8)
    print("After:", run_js("document.title + '|' + location.href"))

if __name__ == '__main__':
    main()
