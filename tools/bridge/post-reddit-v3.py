#!/usr/bin/env python3
import subprocess, base64, time

def run_js(js_code):
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
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        return f"ERROR: {result.stderr.strip()}"
    return result.stdout.strip()

# Fill the title (first contenteditable div) and body (name=body div)
fill_js = r"""
(function() {
  try {
    var titleEl = document.querySelector('div[contenteditable="true"]');
    var bodyEl = document.querySelector('div[name="body"][contenteditable="true"], div[aria-label="Post body text field"]');

    var out = [];
    if (titleEl) {
      titleEl.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, 'BSAHI: Bitcoin Block Space Research - Live Data');
      out.push('title=OK:' + titleEl.textContent.trim());
    } else { out.push('title=NONE'); }

    if (bodyEl) {
      bodyEl.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, "Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com");
      out.push('body=OK:' + bodyEl.textContent.trim().slice(0,30));
    } else { out.push('body=NONE'); }

    return out.join(' || ');
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
print("Fill:", run_js(fill_js))
time.sleep(2)

# Find and click Post button
post_js = r"""
(function() {
  try {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].textContent || '').trim().toLowerCase();
      var aria = (btns[i].getAttribute('aria-label') || '').toLowerCase();
      if ((t === 'post' || aria === 'post' || t.includes('post') || aria.includes('post')) && !btns[i].disabled) {
        btns[i].click();
        return 'CLICKED: ' + (btns[i].textContent || '').trim();
      }
    }
    // List all buttons to see what's there
    var btns2 = [];
    document.querySelectorAll('button').forEach(function(b) {
      var t = (b.textContent || '').trim();
      if (t.length < 30) btns2.push(t + (b.disabled?'(d)':''));
    });
    return 'NO CLICK. Buttons: ' + btns2.join('|');
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
print("Post:", run_js(post_js))
time.sleep(6)

# Check result
result = run_js("document.title + '|' + location.href")
print("After:", result)
