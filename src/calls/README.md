# Afghan Chat calling module

This folder prepares the calling feature without placing real calls.

## Included
- Voice/video call configuration flags.
- A provider-neutral call session adapter.
- A safe preparation screen in the React app.

## Current safety state
All real call capabilities are disabled. No phone call, network signaling,
microphone permission, or camera permission is started by this module.

## Required before production calling
1. Select and configure a signaling/calling provider (for example, a WebRTC SFU).
2. Implement authenticated signaling and call invitations on the backend.
3. Add TURN/STUN configuration and production credentials as environment secrets.
4. Add incoming-call handling, push notifications, permissions, reconnect logic,
   call timeout, busy/reject states, and call history persistence.
5. Test Android audio routing, camera permissions, background behavior, and
   network transitions on physical devices.

Do not set the feature flags to true until the backend and security review are complete.
