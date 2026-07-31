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

# Find faceplate-text-input components and their shadow DOM
js = r"""
(function() {
  try {
    var fps = document.querySelectorAll('faceplate-text-input');
    var out = [];
    for (var i = 0; i < fps.length; i++) {
      var fp = fps[i];
      var inner = '';
      if (fp.shadowRoot) {
        var input = fp.shadowRoot.querySelector('input');
        inner = input ? 'shadow-input:' + input.id + '|ph=' + (input.placeholder||'') : 'no-input-in-shadow';
      }
      out.push(fp.tagName + '|name=' + (fp.getAttribute('name')||'') + '|' + inner);
    }
    return 'FOUND ' + fps.length + ': ' + out.join(' || ');
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
print("Faceplate components:", run_js(js))

# Also check title area
js2 = r"""
(function() {
  try {
    var out = [];
    document.querySelectorAll('div[contenteditable="true"], [role="textbox"]').forEach(function(el) {
      out.push(el.tagName + '|name=' + (el.getAttribute('name')||'') + '|aria=' + (el.getAttribute('aria-label')||'') + '|ph=' + (el.getAttribute('data-placeholder')||el.getAttribute('aria-placeholder')||'').slice(0,30));
    });
    return out.join(' || ');
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
print("Textboxes:", run_js(js2))
