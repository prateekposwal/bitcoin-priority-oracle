#!/usr/bin/env python3
import subprocess, base64, time

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
    return result.stdout.strip() if result.returncode == 0 else f"ERROR"

def keystroke(text):
    """Type text via OS keystroke (genuine input, editor accepts it)."""
    # Escape for AppleScript
    safe = text.replace('\\', '\\\\').replace('"', '\\"')
    script = f'''
    tell application "Google Chrome" to activate
    delay 0.3
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
    time.sleep(7)

    # Focus the title field via JS
    print("Focus title:", run_js(r"""
(function() {
  var el = document.querySelector('div[contenteditable="true"]');
  if (el) { el.focus(); el.click(); return 'focused'; }
  return 'not found';
})()
"""))
    time.sleep(0.5)

    # Type title via keystroke
    keystroke("BSAHI: Bitcoin Block Space Research - Live Data")
    time.sleep(1)

    # Verify title text
    print("Title now:", run_js(r"""
(function() {
  var el = document.querySelector('div[contenteditable="true"]');
  return el ? el.textContent.trim() : 'not found';
})()
"""))

    # Focus body field
    print("Focus body:", run_js(r"""
(function() {
  var el = document.querySelector('div[name="body"][contenteditable="true"], div[aria-label="Post body text field"]');
  if (el) { el.focus(); el.click(); return 'focused'; }
  return 'not found';
})()
"""))
    time.sleep(0.5)

    # Type body via keystroke
    keystroke("Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com")
    time.sleep(1)

    # Verify body
    print("Body now:", run_js(r"""
(function() {
  var el = document.querySelector('div[aria-label="Post body text field"]');
  return el ? el.textContent.trim().slice(0,40) : 'not found';
})()
"""))

    # Find Post button
    print("Buttons:", run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('button').forEach(function(b) {
    var t = (b.textContent || '').trim();
    if (t.length < 30 && t.length > 0) out.push(t + (b.disabled?'(d)':''));
  });
  return out.join(' | ');
})()
"""))

    # Click Post
    print("Click:", run_js(r"""
(function() {
  var btns = document.querySelectorAll('button');
  for (var i = 0; i < btns.length; i++) {
    var t = (btns[i].textContent || '').trim().toLowerCase();
    var aria = (btns[i].getAttribute('aria-label') || '').toLowerCase();
    if ((t === 'post' || aria === 'post' || t.includes('post')) && !btns[i].disabled) {
      btns[i].click();
      return 'CLICKED';
    }
  }
  return 'NO button';
})()
"""))
    time.sleep(6)
    print("After:", run_js("document.title + '|' + location.href"))

if __name__ == '__main__':
    main()
