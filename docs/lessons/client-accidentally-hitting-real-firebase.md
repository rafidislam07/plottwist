# Preventing Client Traffic to Real Firebase During Local Dev

## What happened
There was a risk that local app actions could hit real Firebase endpoints instead of emulators.

## Why it happened
Without explicit emulator wiring in client runtime, SDK calls can default to production endpoints.

## How we fixed it
1. Added emulator wiring in `src/lib/firebase/client.ts`:
   - `connectAuthEmulator(...)`
   - `connectFirestoreEmulator(...)`
   - `connectFunctionsEmulator(...)`
2. Enabled this in dev/demo mode and guarded to run once.
3. Used `demo-plottwist` and `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`.

## How to verify
- Create/join actions show up in Emulator UI.
- No production Firebase usage during local runs.

## ELI5
We changed the app GPS so every road points to the local practice map, not the real city.

## Prevention checklist
- Keep emulator flag enabled for local dev.
- Keep demo project default for emulator workflows.
