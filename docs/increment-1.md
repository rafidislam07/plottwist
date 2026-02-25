# Increment 1 - Journey Log (From Start to Current State)

## Purpose

This document captures our full journey so far, in execution order, with technical reasoning and lessons learned.
The goal is to build the codebase in small, safe increments while understanding _why_ each change exists.

---

## 0. Initial Context

We started with a Next.js app and an architecture doc in progress.
You wanted:

1. Clean architecture docs
2. Firebase + Firestore setup
3. A secure multiplayer game flow
4. Learning-oriented, step-by-step delivery

---

## 1. Architecture Documentation Fixes

### What happened

You shared Sections 6-11 as raw Markdown and asked to insert them into `ARCHITECTURE.md`.

### Actions taken

1. Added Sections 6-11 into `docs/ARCHITECTURE.md`
2. Fixed a broken code fence in Section 3 that was causing render issues
3. Corrected section ordering so headings flow from 1 through 11

### Why this mattered

If Markdown is wrapped in a fenced code block, GitHub renders it as literal text, not headings/lists.
Fixing docs first gave us a shared technical contract before code changes.

---

## 2. Commit + Push (Earlier Phase)

### What happened

You asked to commit and push latest changes.

### Actions taken

1. Confirmed there were extra local changes (not just docs)
2. You chose to include all changes
3. Created commit and pushed to `main`

### Result

A commit was published that included docs + other pending local file changes.

---

## 3. Firebase Setup Guidance

### What happened

You asked how to set up Firebase from console onboarding.

### Actions taken

1. Advised Spark/free-only setup
2. Guided `.env.local` creation using your Firebase web config
3. Explained enabling Firestore + Anonymous Auth
4. Clarified choosing Firestore **Standard edition** (not Enterprise)

### Why this mattered

We needed a valid project baseline before writing app code.

---

## 4. First Implementation Attempt (Then Corrected)

### What happened

I initially implemented a working game loop quickly, then you correctly called out an architecture mismatch:

- Architecture said critical mutations should be Cloud Functions
- Early code had logic that could expose sensitive game state if left client-side

### Your key correction

You asked whether we should be doing Plan A (Cloud Functions) from the start.
That was correct.

### What was done after correction

1. Moved core mutation logic to callable Cloud Functions
2. Adjusted client to call those functions
3. Tightened Firestore rules toward read-only client writes

### Engineering lesson

A fast MVP loop is useful, but for privacy-sensitive flows, authority boundaries must be designed first.
Your feedback improved architectural correctness.

---

## 5. Reset Request (Start Over in Small Increments)

### What you requested

You asked to undo the added code and restart from the point where only `.env.local` was done, with strict process rules:

1. Build from scratch in small increments
2. Use short-lived branches
3. Touch max 3 files per increment
4. For every change, provide:
   - files changed
   - what each file does
   - exact manual test steps
   - what to read first
5. No new dependencies without explicit approval
6. Explain code in execution order
7. Add TODOs where uncertain

### Actions taken

1. Restored tracked files back to committed baseline
2. Removed newly added untracked Firebase/game files
3. Preserved `.env.local`
4. Verified clean status

---

## 6. Increment 1 (Current Increment)

## 6.1 Branching

Created short-lived branch:

- `wip/inc1-firebase-bootstrap`

Reason: isolate incremental work and keep rollback simple.

## 6.2 Dependency policy check

Checked `package.json` and confirmed `firebase` dependency was not present.

Because you required "no new deps without approval", Increment 1 avoided SDK wiring and focused on env config only.

## 6.3 Code change (1 file)

Added:

- `src/lib/firebase/config.ts`

### What this file does

1. Defines required Firebase env key type
2. Implements `getRequiredEnv(key)` to fail fast when env vars are missing
3. Exposes `getFirebaseWebConfig()` returning typed web config
4. Adds TODO for future region config:
   - `TODO: Add NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION when we wire callable functions.`

## 6.4 Validation

Ran:

1. `npm run lint`

Result: pass

---

## 7. Execution Order for Increment 1 Code

When later imported by app code:

1. `getFirebaseWebConfig()` is called
2. It calls `getRequiredEnv(...)` for each required key
3. Missing key throws immediately with explicit error message
4. Valid config object is returned for Firebase SDK initialization (next increment)

---

## 8. Why Increment 1 is intentionally small

This increment only establishes config correctness, not runtime Firebase behavior.

Benefits:

1. Minimal surface area (1 file)
2. Easy to review
3. Clear failure mode when env is incomplete
4. Sets foundation for Increment 2 without introducing hidden side effects

---

## 9. Current Repository State (After Increment 1)

1. Branch: `wip/inc1-firebase-bootstrap`
2. New file: `src/lib/firebase/config.ts`
3. No new dependencies added
4. `.env.local` remains local and intact

---

## 10. TODOs and Open Decisions

1. TODO: Add `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION` support when callable functions are introduced.
2. Decide whether to approve adding `firebase` SDK in Increment 2.
3. Decide first runtime milestone for Increment 2:
   - just Firebase app singleton init
   - or singleton + anonymous auth bootstrap

---

## 11. SWE Takeaways So Far

1. Correctness before speed for trust/security boundaries
2. Small increments reduce blast radius and improve learning
3. Branch isolation makes rollback cheap
4. Fail-fast config validation prevents ambiguous runtime bugs
5. Explicit test steps per increment keep progress objective

