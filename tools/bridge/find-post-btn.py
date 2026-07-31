#!/usr/bin/env python3
import subprocess, base64

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

# Find all buttons and their text
js = r"""
(function() {
  var btns = document.querySelectorAll('button');
  var out = [];
  for (var i = 0; i < btns.length; i++) {
    var t = (btns[i].innerText || '').trim();
    var d = btns[i].disabled;
    if (t.length > 0 && t.length < 40) {
      out.push(t + (d ? '(disabled)' : ''));
    }
  }
  return out.join(' | ');
})()
"""
print("Buttons:", run_js(js))

# Also check for Post button variants
js2 = r"""
(function() {
  var all = document.querySelectorAll('button, [role="button"]');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    var t = (el.innerText || '').trim().toLowerCase();
    var aria = (el.getAttribute('aria-label') || '').toLowerCase();
    if (t === 'post' || aria === 'post' || t.includes('post')) {
      return 'FOUND: tag=' + el.tagName + ' text=' + (el.innerText||'').trim() + ' aria=' + (el.getAttribute('aria-label')||'') + ' disabled=' + el.disabled;
    }
  }
  return 'no post button found';
})()
"""
print("Search:", run_js(js2))
