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

def main():
    # Look for post type tabs (Link / Text / Poll / etc.)
    print("Post types:", run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('button, [role="tab"], [role="radio"], a').forEach(function(el) {
    var t = (el.textContent || '').trim();
    if (t === 'Post' || t === 'Text' || t === 'Link' || t === 'Poll' || t === 'Image' || t === 'Video') {
      out.push(el.tagName + ':' + t + '|aria=' + (el.getAttribute('aria-label')||'').slice(0,20) + '|sel=' + (el.getAttribute('aria-selected')||''));
    }
  });
  return out.join(' || ') || 'NONE';
})()
"""))

    # Check for a modal/dialog with post type
    print("Tabs:", run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('[role="tab"]').forEach(function(el) {
    out.push((el.textContent||'').trim() + '|sel=' + el.getAttribute('aria-selected'));
  });
  return out.join(' || ') || 'no tabs';
})()
"""))

    # Look for 'Text' or 'Post' tab to click
    print("Click Text tab:", run_js(r"""
(function() {
  var els = document.querySelectorAll('button, [role="tab"], [role="radio"], a');
  for (var i = 0; i < els.length; i++) {
    var t = (els[i].textContent || '').trim();
    if (t === 'Text' || t === 'Post') {
      els[i].click();
      return 'clicked: ' + t;
    }
  }
  return 'no text tab';
})()
"""))
    time.sleep(2)

    # Re-check contenteditable and buttons
    print("After switch:", run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('[contenteditable="true"]').forEach(function(el, idx) {
    out.push(idx + ':' + (el.getAttribute('aria-label')||'').slice(0,25) + '|' + el.textContent.trim().slice(0,15));
  });
  var btns = [];
  document.querySelectorAll('button').forEach(function(b) {
    var t = (b.textContent || '').trim();
    if (t.length < 25 && t.length > 0) btns.push(t + (b.disabled?'(d)':''));
  });
  return 'CE: ' + out.join(' || ') + ' | BTNS: ' + btns.join('|');
})()
"""))

if __name__ == '__main__':
    main()
