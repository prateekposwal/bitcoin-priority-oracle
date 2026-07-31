#!/usr/bin/env python3
import subprocess, base64, time

def run_js(js_code, timeout=30):
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
    if result.returncode != 0:
        return f"ERROR: {result.stderr.strip()}"
    return result.stdout.strip()

def set_url(url):
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome"
        set URL of active tab of front window to "{url}"
    end tell'''], capture_output=True, text=True, timeout=30)

# Fill using InputEvent insertText (modern, doesn't block)
fill_js = r"""
(function() {
  try {
    var titleEl = document.querySelector('div[contenteditable="true"]');
    var bodyEl = document.querySelector('div[name="body"][contenteditable="true"], div[aria-label="Post body text field"]');
    var out = [];

    function setContent(el, text) {
      el.focus();
      el.innerHTML = '';
      var evt = new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: text });
      el.dispatchEvent(evt);
      el.textContent = text;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    if (titleEl) {
      setContent(titleEl, 'BSAHI: Bitcoin Block Space Research - Live Data');
      out.push('title=OK:' + titleEl.textContent.trim().slice(0,20));
    } else { out.push('title=NONE'); }

    if (bodyEl) {
      setContent(bodyEl, "Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com");
      out.push('body=OK:' + bodyEl.textContent.trim().slice(0,20));
    } else { out.push('body=NONE'); }

    return out.join(' || ');
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""

def main():
    set_url("https://www.reddit.com/r/Bitcoin/submit")
    time.sleep(6)
    print("Fill:", run_js(fill_js))
    time.sleep(2)

    # Find Post button
    find_btn = r"""
(function() {
  try {
    var btns = document.querySelectorAll('button');
    var out = [];
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].textContent || '').trim();
      if (t.length < 30 && t.length > 0) out.push(t + (btns[i].disabled?'(d)':''));
    }
    return out.join(' | ');
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
    print("Buttons:", run_js(find_btn))

    click_btn = r"""
(function() {
  try {
    var btns = document.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      var t = (btns[i].textContent || '').trim().toLowerCase();
      var aria = (btns[i].getAttribute('aria-label') || '').toLowerCase();
      if ((t === 'post' || aria === 'post' || t.includes('post')) && !btns[i].disabled) {
        btns[i].click();
        return 'CLICKED Post';
      }
    }
    return 'NO Post button';
  } catch(e) { return 'ERR: ' + e.message; }
})()
"""
    print("Click:", run_js(click_btn))
    time.sleep(6)
    print("After:", run_js("document.title + '|' + location.href"))

if __name__ == '__main__':
    main()
