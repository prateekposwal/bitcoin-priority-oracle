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
    return result.stdout.strip() if result.returncode == 0 else f"OSERR"

def keystroke(text):
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome" to activate
    delay 0.2
    tell application "System Events"
        keystroke "{text}"
    end tell'''], capture_output=True, text=True, timeout=25)

def main():
    # Click into the body via JS mouse events to place cursor
    print("Click body:", run_js(r"""
(function() {
  var body = document.querySelector('div[aria-label="Post body text field"]');
  if (!body) return 'no body';
  body.focus();
  var rect = body.getBoundingClientRect();
  var x = rect.left + 50;
  var y = rect.top + 10;
  var opts = { bubbles: true, cancelable: true, clientX: x, clientY: y };
  body.dispatchEvent(new MouseEvent('mousedown', opts));
  body.dispatchEvent(new MouseEvent('mouseup', opts));
  body.dispatchEvent(new MouseEvent('click', opts));
  return 'clicked at ' + Math.round(x) + ',' + Math.round(y);
})()
"""))
    time.sleep(0.8)

    # Now type via keystroke
    keystroke("Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com")
    time.sleep(1)

    # Verify
    print("Body:", run_js(r"""
(function() {
  var body = document.querySelector('div[aria-label="Post body text field"]');
  return body ? body.textContent.trim() : 'none';
})()
"""))

    # Check Post button
    print("Post:", run_js(r"""
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
