/**
 * Ack helpers for socket event handlers. Acks follow the contract shape:
 * `{ status: 'ok', data }` or `{ status: 'error', code, message }`.
 */
function ok(data) {
  return { status: 'ok', data };
}

function error(code, message) {
  return { status: 'error', code, message };
}

function errorFromApiError(err) {
  const code = err && err.code ? err.code : 'INTERNAL_ERROR';
  return error(code, (err && err.message) || 'Internal error');
}

function rateLimited(message = 'Rate limit exceeded') {
  return error('RATE_LIMITED', message);
}

module.exports = { ok, error, errorFromApiError, rateLimited };
