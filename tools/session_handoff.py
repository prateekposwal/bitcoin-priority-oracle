#!/usr/bin/env python3
"""
Session Handoff Writer — writes structured context to AGENTS.md
Call at end of session: python3 tools/session_handoff.py
"""
import os, datetime, json

TOOLS_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.dirname(TOOLS_DIR)
AGENTS_PATH = os.path.join(REPO_DIR, 'AGENTS.md')

def append_handoff(project, state, decisions, open_issues, next_steps):
    """Append a structured session handoff to AGENTS.md."""
    if not os.path.exists(AGENTS_PATH):
        os.makedirs(os.path.dirname(AGENTS_PATH), exist_ok=True)
        with open(AGENTS_PATH, 'w') as f:
            f.write("# Session Handoffs\n\n")

    with open(AGENTS_PATH, 'a') as f:
        f.write(f"\n## Session Handoff — {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"\n### Project: {project}\n")
        f.write(f"- Session mood: {state.get('mood', 'neutral')}\n")
        f.write(f"- Current focus: {state.get('focus', 'none')}\n")
        f.write(f"\n### Decisions Made\n")
        for d in decisions:
            f.write(f"- {d}\n")
        f.write(f"\n### Open Issues\n")
        for i in open_issues:
            f.write(f"- {i}\n")
        f.write(f"\n### Next Steps\n")
        for s in next_steps:
            f.write(f"- {s}\n")
    
    print(f"Handoff written to {AGENTS_PATH}")

if __name__ == "__main__":
    import sys
    project = sys.argv[1] if len(sys.argv) > 1 else "TELOS/unknown"
    print(f"Writing handoff for: {project}")
    print("Edit the template below then run again with arguments or hardcode.")
