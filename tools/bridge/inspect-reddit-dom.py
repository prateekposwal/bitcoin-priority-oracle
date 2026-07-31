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

# Find inputs and textareas
js = r"""
(function() {
  try {
    var els = document.querySelectorAll('input, textarea, [contenteditable="true"], [role="textbox"]');
    var out = [];
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      out.push(el.tagName + '|name=' + (el.getAttribute('name')||'') + '|ph=' + (el.getAttribute('placeholder')||'').slice(0,25) + '|aria=' + (el.getAttribute('aria-label')||'').slice(0,25) + '|visible=' + (el.offsetParent !== null));
    }
    return 'FOUND ' + els.length + ': ' + out.join(' || ');
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
print("Form elements:", run_js(js))

# Look for the title field specifically
js2 = r"""
(function() {
  try {
    var results = [];
    document.querySelectorAll('*').forEach(function(el) {
      if (el.children && el.children.length === 0) {
        var t = (el.textContent || '').trim();
        if (t === 'Title' || t === 'Add a title' || t === 'Title*') {
          results.push(el.tagName + '|' + el.className.slice(0,30));
        }
      }
    });
    return 'title labels: ' + results.join(' || ');
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
print("Title labels:", run_js(js2))

# Find the Post button by any means
js3 = r"""
(function() {
  try {
    var results = [];
    document.querySelectorAll('button').forEach(function(b) {
      var t = (b.textContent || '').trim().toLowerCase();
      var aria = (b.getAttribute('aria-label') || '').toLowerCase();
      if (t === 'post' || aria === 'post' || t.includes('post') || aria.includes('post')) {
        results.push('text=' + b.textContent.trim().slice(0,20) + '|aria=' + aria + '|disabled=' + b.disabled + '|visible=' + (b.offsetParent!==null));
      }
    });
    return results.length ? results.join(' || ') : 'NO post button';
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
print("Post buttons:", run_js(js3))
