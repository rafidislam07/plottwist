# Same-Device Rejoin Confusion

## What happened
Rejoining from the same browser profile did not increase player count, which looked like a bug.

## Why it happened
Join is idempotent by UID. Same browser profile usually means same anonymous UID, so it is treated as the same player rejoining.

## How we fixed it
1. `joinRoom` response distinguishes `alreadyJoined`.
2. Join page redirects with `?rejoined=1` for that case.
3. Room page shows a banner explaining why headcount did not change.

## How to verify
- Join with same profile twice: no duplicate player row, banner shown.
- Join with incognito/different profile: player count increases.

## ELI5
You cannot be counted twice in the same room just by opening another tab with the same identity.

## Prevention checklist
- Keep idempotent joins.
- Explain rejoin behavior in UI to reduce confusion.
