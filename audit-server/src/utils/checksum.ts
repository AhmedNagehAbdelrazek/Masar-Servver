import crypto from 'node:crypto';

export function generateChecksum(event: Record<string, unknown>): string {
  const canonical = JSON.stringify({
    event_id: event.id,
    trace_id: event.trace_id,
    span_id: event.span_id,
    service_name: event.service_name,
    action: event.action,
    path: event.path,
    status_code: event.status_code,
    event_time: event.event_time,
  });

  return crypto.createHash('sha256').update(canonical).digest('hex');
}
