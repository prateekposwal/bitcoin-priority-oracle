#!/usr/bin/env python3
import subprocess, base64, time, sys

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

def set_url(url):
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome"
        set URL of active tab of front window to "{url}"
    end tell'''], capture_output=True, text=True, timeout=30)

# React-compatible fill for Reddit
fill_js = r"""
(function() {
  var out = [];

  // Title input - use native value setter for React
  var title = document.querySelector('input[name="title"], #post-title, [id*="title"], input[placeholder*="Title"]');
  if (title) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(title, 'BSAHI: Bitcoin Block Space Research - Live Data');
    title.dispatchEvent(new Event('input', {bubbles: true}));
    title.dispatchEvent(new Event('change', {bubbles: true}));
    out.push('title=' + title.value);
  } else { out.push('title=NONE'); }

  // Body - contenteditable, use execCommand to trigger React onChange
  var body = document.querySelector('[role="textbox"][contenteditable], [contenteditable="true"], textarea');
  if (body) {
    body.focus();
    if (body.tagName === 'TEXTAREA') {
      var setter2 = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter2.call(body, "Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com");
      body.dispatchEvent(new Event('input', {bubbles: true}));
    } else {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, "Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com");
    }
    out.push('body=OK');
  } else { out.push('body=NONE'); }

  return out.join(' ');
})()
"""

def main():
    set_url("https://www.reddit.com/r/Bitcoin/submit")
    time.sleep(6)
    print("Fill:", run_js(fill_js))
    time.sleep(2)

    # Now check for Post button (it should be enabled now)
    check_js = r"""
(function() {
  var btns = document.querySelectorAll('button');
  var posts = [];
  for (var i = 0; i < btns.length; i++) {
    var t = (btns[i].innerText || '').trim();
    var aria = (btns[i].getAttribute('aria-label') || '');
    if (t === 'Post' || aria === 'Post' || (t && t.toLowerCase().startsWith('post'))) {
      posts.push(t + '|disabled=' + btns[i].disabled + '|aria=' + aria);
    }
  }
  return posts.length ? posts.join(' || ') : 'NO POST BUTTON';
})()
"""
    print("Post buttons:", run_js(check_js))

    submit_js = r"""
(function() {
  var btns = document.querySelectorAll('button');
  for (var i = 0; i < btns.length; i++) {
    var t = (btns[i].innerText || '').trim();
    var aria = (btns[i].getAttribute('aria-label') || '');
    if ((t === 'Post' || aria === 'Post') && !btns[i].disabled) {
      btns[i].click();
      return 'CLICKED Post';
    }
  }
  // Try disabled check - maybe it needs form validation
  return 'still no enabled Post button';
})()
"""
    print("Submit:", run_js(submit_js))
    time.sleep(5)

    state = run_js("document.title + '|' + location.href")
    print("After:", state)

if __name__ == '__main__':
    main()
