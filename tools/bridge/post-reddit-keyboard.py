#!/usr/bin/env python3
import subprocess, base64, time

def run_js(js_code, timeout=15):
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

def keycode(code):
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome" to activate
    delay 0.2
    tell application "System Events"
        key code {code}
    end tell'''], capture_output=True, text=True, timeout=15)

def set_url(url):
    subprocess.run(['osascript', '-e', f'''
    tell application "Google Chrome"
        set URL of active tab of front window to "{url}"
    end tell'''], capture_output=True, text=True, timeout=30)

def main():
    set_url("https://www.reddit.com/r/Bitcoin/submit")
    time.sleep(9)

    # Check what's auto-focused
    print("Auto-focus:", run_js("document.activeElement.tagName + '|' + (document.activeElement.getAttribute('aria-label')||'') + '|' + (document.activeElement.getAttribute('name')||'')"))

    # Clear any pre-filled title junk and type fresh
    keystroke("a")  # select all
    subprocess.run(['osascript', '-e', 'tell application "System Events" to keystroke "a" using command down'], capture_output=True, text=True, timeout=10)
    time.sleep(0.3)
    keystroke("BSAHI: Bitcoin Block Space Research - Live Data")
    time.sleep(0.8)

    # Check title value
    print("Title:", run_js(r"""
(function() {
  var comp = document.querySelector('post-composer-title');
  var t = comp ? (comp.shadowRoot || comp).querySelector('textarea') : null;
  return t ? t.value : 'none';
})()
"""))

    # Press Tab to move to body
    keycode(48)
    time.sleep(0.6)
    print("After tab:", run_js("document.activeElement.tagName + '|' + (document.activeElement.getAttribute('aria-label')||'')"))

    # Type body
    keystroke("Bitcoin's blocks are full by design. At $68K average transaction value, Bitcoin settles $5.9B daily. Storage cost coverage: 1.5%. Live data at bitcoinsahi.com")
    time.sleep(1.2)

    # Verify both
    print("Verify:", run_js(r"""
(function() {
  var comp = document.querySelector('post-composer-title');
  var t = comp ? (comp.shadowRoot || comp).querySelector('textarea') : null;
  var body = document.querySelector('div[aria-label="Post body text field"]');
  return 'T=[' + (t ? t.value : 'none') + '] B=[' + (body ? body.textContent.trim().slice(0,25) : 'none') + ']';
})()
"""))

if __name__ == '__main__':
    main()
