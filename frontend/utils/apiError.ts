/**
 * Normalize API error detail (string, array of validation errors, or single object) to a display string.
 * FastAPI returns 422 details as objects with keys like type, loc, msg, input, ctx, url.
 */
export function apiErrorToMessage(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (first && typeof first === 'object' && 'msg' in first)
      return String((first as { msg: string }).msg);
    return JSON.stringify(detail);
  }
  if (detail && typeof detail === 'object' && 'msg' in detail)
    return String((detail as { msg: string }).msg);
  return fallback;
}
