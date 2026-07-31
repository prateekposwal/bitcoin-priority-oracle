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
    safe = text.replace('\\', '\\\\').replace('"', '\\"')
    script = f'''
    tell application "Google Chrome" to activate
    delay 0.2
    tell application "System Events"
        keystroke "{safe}"
    end tell
    '''
    subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=20)

def main():
    # Inspect all contenteditable elements to find the title properly
    print("Contenteditables:", run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('[contenteditable="true"]').forEach(function(el, idx) {
    out.push(idx + ':' + el.tagName + '|name=' + (el.getAttribute('name')||'') + '|aria=' + (el.getAttribute('aria-label')||'').slice(0,25) + '|ph=' + (el.getAttribute('data-placeholder')||'').slice(0,25) + '|text=' + el.textContent.trim().slice(0,20));
  });
  return out.join(' || ');
})()
"""))

    # Focus the title (first contenteditable) and click it precisely
    print("Focus title:", run_js(r"""
(function() {
  var els = document.querySelectorAll('[contenteditable="true"]');
  if (els.length > 0) {
    var el = els[0];
    el.focus();
    el.click();
    el.scrollIntoView();
    return 'focused el0: ' + el.getAttribute('aria-label');
  }
  return 'none';
})()
"""))
    time.sleep(0.8)

    # Type title
    keystroke("BSAHI: Bitcoin Block Space Research - Live Data")
    time.sleep(0.8)

    # Verify
    print("Title now:", run_js(r"""
(function() {
  var els = document.querySelectorAll('[contenteditable="true"]');
  return els.length > 0 ? els[0].textContent.trim() : 'none';
})()
"""))

    # Now check for Post button
    time.sleep(1)
    print("Post buttons:", run_js(r"""
(function() {
  var out = [];
  document.querySelectorAll('button').forEach(function(b) {
    var t = (b.textContent || '').trim();
    var aria = (b.getAttribute('aria-label') || '');
    if (t === 'Post' || aria === 'Post' || t.toLowerCase().includes('post')) {
      out.push(t + '|' + aria + '|' + b.disabled);
    }
  });
  return out.join(' || ') || 'NONE';
})()
"""))

    # Try clicking Post
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
  // if disabled, report
  for (var j = 0; j < btns.length; j++) {
    var t2 = (btns[j].textContent || '').trim().toLowerCase();
    var aria2 = (btns[j].getAttribute('aria-label') || '').toLowerCase();
    if (t2 === 'post' || aria2 === 'post') {
      return 'FOUND but disabled=' + btns[j].disabled;
    }
  }
  return 'NO POST BUTTON AT ALL';
})()
"""))
    time.sleep(6)
    print("After:", run_js("document.title + '|' + location.href"))

if __name__ == '__main__':
    main()
