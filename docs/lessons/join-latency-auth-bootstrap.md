# Join Latency from Auth Bootstrap

## What happened
Joining sometimes felt slow, especially first action in a fresh tab/session.

## Why it happened
Anonymous auth identity had to initialize before callable `joinRoom` could run.

## How we fixed it
1. Added explicit identity-preparation status on join page.
2. Updated button/UX copy while auth is initializing.
3. Prevented confusing "nothing is happening" experience.

## How to verify
- On a fresh session, join page briefly shows identity setup status.
- Once auth is ready, submit proceeds normally.

## ELI5
Before opening the room door, the app has to print your visitor badge. We now show "printing badge..." so waiting makes sense.

## Prevention checklist
- Surface auth-prep state in auth-dependent forms.
- Keep submit states explicit (`idle`, `preparing`, `submitting`).
