#!/usr/bin/env python3
import subprocess, base64, time, sys

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
    script = f'''
    tell application "Google Chrome" to activate
    delay 0.2
    tell application "System Events"
        keystroke "{safe}"
    end tell
    '''
    subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=20)

def set_url(url):
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome"
        set URL of active tab of front window to "{url}"
    end tell'''], capture_output=True, text=True, timeout=30)

def main():
    set_url("https://www.reddit.com/r/Bitcoin/submit")
    time.sleep(8)

    # Step 1: Check form structure
    print("Structure:", run_js(r"""
(function() {
  var title = document.querySelector('post-composer-title textarea[name="title"]');
  var body = document.querySelector('div[aria-label="Post body text field"]');
  return 'title=' + (title ? 'FOUND' : 'none') + ' body=' + (body ? 'FOUND' : 'none');
})()
"""))

    # Step 2: Set title via native setter
    print("Set title:", run_js(r"""
(function() {
  var title = document.querySelector('post-composer-title textarea[name="title"]');
  if (!title) return 'no title';
  title.focus();
  var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
  setter.call(title, 'BSAHI: Bitcoin Block Space Research - Live Data');
  title.dispatchEvent(new Event('input', {bubbles: true}));
  title.dispatchEvent(new Event('change', {bubbles: true}));
  return 'set: ' + title.value;
})()
"""))
    time.sleep(1)

    # Step 3: Focus body, type via keystroke
    print("Focus body:", run_js(r"""
(function() {
  var body = document.querySelector('div[aria-label="Post body text field"]');
  if (body) { body.focus(); body.click(); return 'focused'; }
  return 'no body';
})()
"""))
    time.sleep(0.5)
    keystroke("Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com")
    time.sleep(1)

    # Step 4: Verify both
    print("Verify:", run_js(r"""
(function() {
  var title = document.querySelector('post-composer-title textarea[name="title"]');
  var body = document.querySelector('div[aria-label="Post body text field"]');
  return 'title=' + (title ? title.value : 'none') + ' body=' + (body ? body.textContent.trim().slice(0,20) : 'none');
})()
"""))

    # Step 5: Find Post button
    print("Post btn:", run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('button').forEach(function(b) {
    var t = (b.textContent || '').trim();
    var aria = (b.getAttribute('aria-label') || '');
    if (t.toLowerCase() === 'post' || aria.toLowerCase() === 'post') {
      out.push('disabled=' + b.disabled);
    }
  });
  return out.join('|') || 'NONE';
})()
"""))

    # Step 6: Click Post
    print("Click:", run_js(r"""
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
  return 'not clickable';
})()
"""))
    time.sleep(7)
    print("After:", run_js("document.title + '|' + location.href"))

if __name__ == '__main__':
    main()
