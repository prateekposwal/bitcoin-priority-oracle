#!/bin/bash
# BSAHI - Post to Reddit via the architect's REAL running Chrome
# Uses AppleScript navigation + System Events keystrokes (OS-level = no bot detection)

# Navigate Chrome to Reddit submit
osascript -e 'tell application "Google Chrome"
    set URL of active tab of front window to "https://www.reddit.com/r/Bitcoin/submit"
    return "navigated"
end tell'

sleep 5

# Check where we landed
osascript -e 'tell application "Google Chrome"
    set theURL to URL of active tab of front window
    return theURL
end tell'