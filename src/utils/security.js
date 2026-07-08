const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const SUBMISSION_COOLDOWN_MS = 1000;

let lastActivity = Date.now();
let lastSubmitTime = 0;

export function recordActivity() {
  lastActivity = Date.now();
}

export function isSessionExpired() {
  return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
}

export function canSubmitTransaction() {
  const now = Date.now();
  if (now - lastSubmitTime < SUBMISSION_COOLDOWN_MS) return false;
  lastSubmitTime = now;
  return true;
}

export function setupInactivityTracker(onExpired) {
  const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  function handle() { recordActivity(); }
  events.forEach((e) => window.addEventListener(e, handle));
  const interval = setInterval(() => {
    if (isSessionExpired()) {
      onExpired();
      events.forEach((e) => window.removeEventListener(e, handle));
      clearInterval(interval);
    }
  }, 60000);
  return () => {
    events.forEach((e) => window.removeEventListener(e, handle));
    clearInterval(interval);
  };
}
