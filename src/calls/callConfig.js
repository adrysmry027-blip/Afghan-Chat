// Afghan Chat call feature configuration.
// Real calling is intentionally disabled until a backend/provider is connected.
export const CALL_FEATURES = Object.freeze({
  enabled: false,
  voice: { enabled: false, provider: null },
  video: { enabled: false, provider: null },
  signaling: { enabled: false, endpoint: null },
  history: { persistence: "local-demo-only" }
});

export const CALL_STATES = Object.freeze({
  IDLE: "idle",
  PREPARING: "preparing",
  CONNECTING: "connecting",
  RINGING: "ringing",
  ACTIVE: "active",
  ENDED: "ended",
  FAILED: "failed"
});
