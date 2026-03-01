# Functions Runtime Not Detected

## What happened
Functions emulator failed with:
`Could not detect runtime for functions at .../functions`

## Why it happened
The Functions directory was missing enough runtime metadata/entrypoint shape for Firebase CLI to load it.

## How we fixed it
1. Ensured `firebase.json` points Functions source to `functions/`.
2. Added valid `functions/package.json` metadata (`main`, `engines.node`).
3. Added a valid entrypoint file `functions/index.js`.

## How to verify
Run:
```bash
firebase emulators:start --only auth,firestore,functions
```
Expected log includes:
`Loaded functions definitions from source: .`

## ELI5
Firebase asked, "Where is your Functions app and what language/runtime should I run?" We gave it the missing label and front door.

## Prevention checklist
- Keep `functions/package.json` valid.
- Keep `functions/index.js` present and exportable.
- Keep `firebase.json` source path correct.
