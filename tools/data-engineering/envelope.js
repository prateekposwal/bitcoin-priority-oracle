var crypto = require('crypto');

var MAGIC = 'BSAHI-CAPTURE';
var ENVELOPE_VERSION = 1;

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function wrapCapture(source, capture, opts) {
  opts = opts || {};
  var data = capture && capture.data !== undefined ? capture.data : null;
  var status = capture && capture.status !== undefined ? capture.status : (capture && capture.error ? 0 : 200);
  var satisfied = capture && capture.error === undefined && status !== 0;
  var nowIso = opts.iso || new Date().toISOString();
  var cycleTs = opts.cycleTs || '';
  var schema = opts.schema || null;

  var env = {
    magic: MAGIC,
    envelopeVersion: ENVELOPE_VERSION,
    schema: schema ? { name: schema.name, major: schema.major, minor: schema.minor } : null,
    captured: {
      source: source,
      cycleTs: cycleTs,
      iso: nowIso,
      satisfied: satisfied,
      attempt: opts.attempt || 1
    },
    provenance: {
      producer: opts.producer || 'unknown',
      producerVersion: opts.producerVersion || '0.0.0',
      protocolDoc: opts.protocolDoc || '',
      dataSha256: data !== null ? sha256(JSON.stringify(data)) : null,
      validated: false,
      validatedBy: null,
      validatedAt: null
    }
  };

  var payload = { env: env };
  if (capture && capture.status !== undefined) payload.status = capture.status;
  if (capture && capture.error !== undefined) payload.error = capture.error;
  if (data !== null || (capture && 'data' in capture)) payload.data = data;
  payload.fetchedAt = capture && capture.fetchedAt ? capture.fetchedAt : nowIso;
  return payload;
}

function markValidated(payload, schemaId) {
  if (!payload || !payload.env) return payload;
  payload.env.provenance.validated = true;
  payload.env.provenance.validatedBy = schemaId;
  payload.env.provenance.validatedAt = new Date().toISOString();
  return payload;
}

function unwrap(payload) {
  if (!payload) return payload;
  if (!payload.env) {
    return {
      status: payload.status !== undefined ? payload.status : (payload.error ? 0 : 200),
      data: payload.data !== undefined ? payload.data : null,
      fetchedAt: payload.fetchedAt || null,
      error: payload.error || undefined,
      env: null
    };
  }
  var out = {
    status: payload.status !== undefined ? payload.status : (payload.env.captured.satisfied ? 200 : 0),
    data: payload.data !== undefined ? payload.data : null,
    fetchedAt: payload.fetchedAt || payload.env.captured.iso || null,
    error: payload.error
  };
  if (!out.error && payload.env && !payload.env.captured.satisfied) out.error = out.error || 'capture failed';
  out.env = payload.env;
  return out;
}

module.exports = {
  MAGIC: MAGIC,
  ENVELOPE_VERSION: ENVELOPE_VERSION,
  sha256: sha256,
  wrapCapture: wrapCapture,
  markValidated: markValidated,
  unwrap: unwrap
};
