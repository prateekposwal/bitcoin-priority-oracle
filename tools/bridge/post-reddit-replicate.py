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
    return result.stdout.strip() if result.returncode == 0 else f"OSERR"

def keystroke(text):
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome" to activate
    delay 0.2
    tell application "System Events"
        keystroke "{text}"
    end tell'''], capture_output=True, text=True, timeout=25)

def set_url(url):
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome"
        set URL of active tab of front window to "{url}"
    end tell'''], capture_output=True, text=True, timeout=30)

def main():
    # Reload fresh
    set_url("https://www.reddit.com/r/Bitcoin/submit")
    time.sleep(9)

    # Set title via shadow DOM native setter (this reliably works)
    print("Title:", run_js(r"""
(function() {
  var comp = document.querySelector('post-composer-title');
  if (!comp) return 'NO-COMP';
  var t = (comp.shadowRoot || comp).querySelector('textarea');
  if (!t) return 'NO-TEXTAREA';
  t.focus();
  var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(t, 'BSAHI: Bitcoin Block Space Research - Live Data');
  t.dispatchEvent(new Event('input', {bubbles:true}));
  t.dispatchEvent(new Event('change', {bubbles:true}));
  return 'SET:' + t.value;
})()
"""))
    time.sleep(1)

    # Focus the body directly (this worked before)
    print("Focus body:", run_js(r"""
(function() {
  var body = document.querySelector('div[aria-label="Post body text field"]');
  if (body) { body.focus(); body.click(); return 'FOCUSED:' + document.activeElement.tagName; }
  return 'NO-BODY';
})()
"""))
    time.sleep(0.8)

    # Type body via keystroke
    keystroke("Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com")
    time.sleep(1.2)

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

    # Check Post button
    print("Post btn:", run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('button').forEach(function(b) {
    var t = (b.textContent || '').trim();
    var aria = (b.getAttribute('aria-label') || '');
    if (t.toLowerCase() === 'post' || aria.toLowerCase() === 'post') out.push('d=' + b.disabled);
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
  return 'NOT-CLICKABLE';
})()
"""))
    time.sleep(8)
    print("After:", run_js("document.title + '|' + location.href"))

if __name__ == '__main__':
    main()
