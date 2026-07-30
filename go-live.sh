# ⬡ BSAHI — Go Live
# Every agent, publisher, and process start in background

DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG="$DIR/captured-data/live.log"
PIDDIR="$DIR/captured-data/pids"
mkdir -p "$PIDDIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }

cleanup() {
  log "Shutting down..."
  for f in "$PIDDIR"/*.pid; do
    [ -f "$f" ] && kill $(cat "$f") 2>/dev/null && log "Stopped $(basename $f .pid)"
  done
  rm -f "$PIDDIR"/*.pid
  log "All stopped"
  exit 0
}
trap cleanup SIGINT SIGTERM

log "=================== BSAHI GO LIVE ==================="
log ""

# 1. DE Server (data + agents)
log "[1/4] Starting DE Server (port 3456)..."
cd "$DIR"
node tools/data-engineering/server.js &
echo $! > "$PIDDIR/de-server.pid"
log "  PID: $(cat $PIDDIR/de-server.pid)"
sleep 2

# 2. Nostr Publisher (background cycle every hour)
log "[2/4] Starting Nostr publisher cycle..."
(
  while true; do
    log "[Nostr] Publishing cycle..."
    cd "$DIR" && node -e "
      var p = require('./tools/marketing/publisher.js');
      p.runCycle().then(function(r) { console.log('[Nostr] ' + r.length + ' posts'); process.exit(0); }).catch(function(e) { console.error('[Nostr] Error:', e.message); process.exit(1); });
    " 2>&1 | tee -a "$LOG"
    log "[Nostr] Next cycle in 60 minutes"
    sleep 3600
  done
) &
echo $! > "$PIDDIR/nostr-publisher.pid"
log "  PID: $(cat $PIDDIR/nostr-publisher.pid)"

# 3. Employee Publisher (if any onboarded)
log "[3/4] Starting employee publisher..."
(
  while true; do
    EMPLOYEE_COUNT=$(cd "$DIR" && node -e "var e=require('./tools/marketing/employees.js'); var emps=e.getEmployees(); console.log(emps.filter(function(e){return e.onboarded}).length);" 2>/dev/null || echo 0)
    if [ "$EMPLOYEE_COUNT" -gt 0 ]; then
      log "[Employees] $EMPLOYEE_COUNT onboarded — publishing..."
      cd "$DIR" && node -e "
        var e = require('./tools/marketing/employees.js');
        e.runAllEmployees().then(function(r) { console.log('[Employees] Done'); process.exit(0); }).catch(function(err) { console.error('[Employees] Error:', err.message); process.exit(1); });
      " 2>&1 | tee -a "$LOG"
    fi
    log "[Employees] Next cycle in 8 hours"
    sleep 28800
  done
) &
echo $! > "$PIDDIR/employee-publisher.pid"
log "  PID: $(cat $PIDDIR/employee-publisher.pid)"

# 4. Health check + RSS update
log "[4/4] Starting health monitor..."
(
  while true; do
    # Check DE server
    if curl -sf http://localhost:3456/health > /dev/null 2>&1; then
      :
    else
      log "[Health] DE server down — restarting..."
      cd "$DIR" && node tools/data-engineering/server.js &
      echo $! > "$PIDDIR/de-server.pid"
    fi
    # Generate fresh RSS
    cd "$DIR" && node -e "require('./tools/marketing/publisher.js').generateRSSFeed();" 2>/dev/null
    sleep 300
  done
) &
echo $! > "$PIDDIR/health-monitor.pid"
log "  PID: $(cat $PIDDIR/health-monitor.pid)"

log ""
log "=================== ALL SYSTEMS LIVE ==================="
log "DE Server:   http://localhost:3456"
log "Dashboard:   http://localhost:3456"
log "Nostr posts: Every 60 minutes"
log "Employees:   Every 8 hours"
log "RSS feed:    Updated every 5 minutes"
log ""
log "Team: http://localhost:3456/employees"
log ""
log "Press Ctrl+C to stop all processes"
log "========================================================"

wait
