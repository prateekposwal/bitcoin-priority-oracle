#!/usr/bin/env python3
import subprocess
import json
import sys
import time

def run_js(js_code):
    """Execute JS in Chrome's active tab via AppleScript."""
    # Base64 encode to avoid all escaping issues
    import base64
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
    script = f'''
    tell application "Google Chrome"
        set URL of active tab of front window to "{url}"
    end tell
    '''
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=30)
    return result.returncode == 0

def get_url_title():
    script = '''
    tell application "Google Chrome"
        set t to title of active tab of front window
        set u to URL of active tab of front window
        return t & "|" & u
    end tell
    '''
    result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, timeout=30)
    return result.stdout.strip()

# ─── Post to Reddit ───
def post_reddit():
    print("=== Posting to Reddit ===")
    set_url("https://www.reddit.com/r/Bitcoin/submit")
    time.sleep(6)
    print("Page:", get_url_title())

    fill_js = r"""
      (function() {
        var title = document.querySelector('input[name="title"], #post-title, [id*="title"], [placeholder*="Title"]');
        var body = document.querySelector('[role="textbox"], [contenteditable="true"], textarea');
        var out = [];
        if (title) {
          title.focus();
          title.value = 'BSAHI: Bitcoin Block Space Research - Live Data';
          title.dispatchEvent(new Event('input', {bubbles: true}));
          title.dispatchEvent(new Event('change', {bubbles: true}));
          out.push('title=OK');
        } else { out.push('title=NONE'); }
        if (body) {
          body.focus();
          body.textContent = "Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com";
          body.dispatchEvent(new Event('input', {bubbles: true}));
          out.push('body=OK');
        } else { out.push('body=NONE'); }
        return out.join(' ');
      })()
    """
    print("Fill:", run_js(fill_js))
    time.sleep(1)

    submit_js = r"""
      (function() {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          if (btns[i].textContent.trim() === 'Post') {
            btns[i].click();
            return 'clicked Post';
          }
        }
        return 'Post button not found';
      })()
    """
    print("Submit:", run_js(submit_js))
    time.sleep(5)
    print("After submit:", get_url_title())

# ─── Post to LinkedIn ───
def post_linkedin():
    print("\n=== Posting to LinkedIn ===")
    set_url("https://www.linkedin.com/feed/")
    time.sleep(6)
    print("Page:", get_url_title())

    check_js = r"""
      (function() {
        var postBtn = document.querySelector('button[aria-label*="Start a post"], button:has-text');
        return 'has start post: ' + (document.body.innerText.includes('Start a post'));
      })()
    """
    print("Check:", run_js(check_js))

    open_js = r"""
      (function() {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          var t = btns[i].innerText || '';
          if (t.includes('Start a post')) {
            btns[i].click();
            return 'opened composer';
          }
        }
        return 'no button';
      })()
    """
    print("Open:", run_js(open_js))
    time.sleep(3)

    fill_li_js = r"""
      (function() {
        var editor = document.querySelector('[contenteditable="true"][role="textbox"], .ql-editor, [data-placeholder*="post"]');
        if (editor) {
          editor.focus();
          editor.innerText = "Bitcoin blocks settle $5.9B daily at $68K average transaction value. 27,800 nodes secure the network. Storage cost coverage: 1.5%. Full research at bitcoinsahi.com";
          editor.dispatchEvent(new Event('input', {bubbles: true}));
          return 'filled editor';
        }
        return 'editor not found';
      })()
    """
    print("Fill:", run_js(fill_li_js))
    time.sleep(1)

    post_li_js = r"""
      (function() {
        var btns = document.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
          var t = btns[i].innerText || '';
          if (t.trim() === 'Post' && !btns[i].disabled) {
            btns[i].click();
            return 'clicked Post';
          }
        }
        return 'Post button not found/disabled';
      })()
    """
    print("Submit:", run_js(post_li_js))
    time.sleep(4)

if __name__ == '__main__':
    action = sys.argv[1] if len(sys.argv) > 1 else 'reddit'
    if action == 'reddit':
        post_reddit()
    elif action == 'linkedin':
        post_linkedin()
    elif action == 'all':
        post_reddit()
        post_linkedin()
    else:
        print("Unknown action")
