var registry = require('./schemas/registry.js');
var env = require('./envelope.js');

function validate(source, payload) {
  var entry = registry.get(source);
  if (!entry) return { ok: false, reasons: ['no schema registered for source: ' + source] };
  if (!payload) return { ok: false, reasons: ['null payload'] };
  var data = payload.data !== undefined ? payload.data : payload;
  if (payload.error !== undefined || (payload.status !== undefined && payload.status === 0)) {
    return { ok: true, reasons: [], isError: true };
  }
  return entry.validate(data);
}

function wrapAndValidate(source, capture, opts) {
  opts = opts || {};
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

module.exports = { validate: validate, wrapAndValidate: wrapAndValidate, runConformance: runConformance, quarantine: quarantine };
