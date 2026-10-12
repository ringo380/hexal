// crypto.randomUUID only exists in secure contexts (HTTPS or localhost). The web
// player is served over plain HTTP on the LAN (http://192.168.x.x:port), where it
// is undefined, and several modules call it at import time. crypto.getRandomValues
// is available in every context, so build an RFC 4122 version 4 UUID from it.
// Imported first by web-player-main.tsx so it runs before any other module.

export function randomUUIDFallback(): `${string}-${string}-${string}-${string}-${string}` {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = randomUUIDFallback;
}
