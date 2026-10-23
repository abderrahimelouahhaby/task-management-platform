type SecurityEvent = {
  event: "unauthenticated" | "access_denied";
  code: string;
  method: string;
  path: string;
  userId?: string;
};

/**
 * Writes ONE line of JSON to the server log, so security events are easy to search.
 * Never put passwords, tokens, cookies or request bodies in here.
 */
export function logSecurityEvent(event: SecurityEvent) {
  console.warn(
    JSON.stringify({
      level: "warn",
      at: new Date().toISOString(),
      ...event,
    }),
  );
}
