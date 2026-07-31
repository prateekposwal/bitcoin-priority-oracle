var registry = require('./schemas/registry.js');
var env = require('./envelope.js');
var fs = require('fs');
var path = require('path');

var VIOLATIONS_LOG = path.join(__dirname, '..', '..', 'captured-data', 'spool', 'schema-violations.log');

function validate(source, payload) {
  var entry = registry.get(source);
  if (!entry) return { ok: false, reasons: ['no schema registered for source: ' + source] };
  if (!payload) return { ok: false, reasons: ['null payload'] };
  var data = payload.data !== undefined ? payload.data : payload;
  if (payload.error !== undefined || (payload.status !== undefined && payload.status === 0) ||
      data === null || data === undefined) {
    return { ok: true, reasons: [], isError: true };
  }
  return entry.validate(data);
}

function normalizeCapture(capture) {
  if (capture && capture.data && typeof capture.data === 'object' && capture.data.ok === false &&
      capture.error === undefined && capture.status === undefined) {
    return { status: 0, error: capture.data.error || 'capture failed', fetchedAt: capture.fetchedAt };
  }
  return capture;
}

function wrapAndValidate(source, capture, opts) {
  opts = opts || {};
  capture = normalizeCapture(capture);
  var payload = env.wrapCapture(source, capture, opts);
  var result = validate(source, payload);
  if (result.ok) {
    var entry = registry.get(source);
    var schemaId = (entry ? entry.schema.name + '@' + entry.schema.major + '.' + entry.schema.minor : 'unknown');
    env.markValidated(payload, schemaId);
    return { payload: payload, ok: true, reasons: [] };
  }
  return { payload: payload, ok: false, reasons: result.reasons };
}

function logViolation(source, cycleTs, reasons, producer, file, logPath) {
  var rec = {
    at: new Date().toISOString(),
    source: source,
    cycleTs: cycleTs,
    reasons: reasons || [],
    producer: producer || 'unknown',
    file: file || null
  };
  var p = logPath || VIOLATIONS_LOG;
  if (!fs.existsSync(path.dirname(p))) fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, JSON.stringify(rec) + '\n');
  return rec;
}

function runConformance(samples) {
  var report = { checked: 0, passed: 0, failed: 0, violations: [] };
  (samples || []).forEach(function(s) {
    report.checked++;
    var entry = registry.get(s.source);
    if (!entry) { report.failed++; report.violations.push({ source: s.source, reasons: ['no schema'] }); return; }
    var r = entry.validate(s.data);
    if (r.ok) report.passed++;
    else { report.failed++; report.violations.push({ source: s.source, reasons: r.reasons }); }
  });
  return report;
}

function quarantine(spool, payload, reasons) {
  if (!spool || !payload || !payload.env) return { ok: false, error: 'no spool or unenveloped payload' };
  var id = payload.env.captured.source + ':' + payload.env.captured.cycleTs;
  return spool.deadletter(id, 'schemaViolation', {
    source: payload.env.captured.source,
    captureTime: payload.env.captured.cycleTs,
    producer: payload.env.provenance.producer,
    detail: (reasons || []).join('; ')
  });
}

module.exports = { validate: validate, wrapAndValidate: wrapAndValidate, runConformance: runConformance, quarantine: quarantine, logViolation: logViolation };
