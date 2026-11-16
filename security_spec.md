# Pixel Spire Security Specification

## 1. Data Invariants
1. **Strict Ownership (`/users/{userId}`)**: A cloud save document may only be read, created, or updated by the verified authenticated user whose `request.auth.uid == userId`.
2. **No PII Leakage**: User email, phone, and address fields are never stored in Firestore (`/users` or `/usernames`).
3. **Immutable Ownership & Timestamps**: `uid` and `createdAt` cannot be modified after creation; `createdAt` and `updatedAt` must equal `request.time`.
4. **Unique Case-Insensitive Usernames (`/usernames/{usernameLower}`)**: Claiming or changing a username must atomically synchronize `/usernames/{usernameLower}` and `/users/{userId}` via `existsAfter` / `getAfter` verification.
5. **Bounded Progress & Arrays**: `unlockedSkins` is bounded (`1..20`), `unlockedThemes` is bounded (`1..12`), and all string fields have strict `.size()` and regex pattern bounds.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing Create**: `/users/victim_uid` with `uid: "attacker_uid"` -> `PERMISSION_DENIED`.
2. **Unverified Email Write**: Write with `request.auth.token.email_verified == false` -> `PERMISSION_DENIED`.
3. **Shadow Ghost Field**: `/users/my_uid` update including `"isAdmin": true` -> `PERMISSION_DENIED` (`hasOnly` rejection).
4. **UID Mutation on Update**: `/users/my_uid` update attempting to change `uid` -> `PERMISSION_DENIED`.
5. **Timestamp Forgery**: Create or update sending client timestamp instead of `serverTimestamp()` -> `PERMISSION_DENIED`.
6. **Oversized ID Poisoning**: Document ID > 128 chars or containing spaces/slashes -> `PERMISSION_DENIED`.
7. **Username Collision Hijack**: Create `/usernames/taken` when doc already exists -> `PERMISSION_DENIED` (`create` only, `update: false`).
8. **Orphaned Username Claim**: Create `/usernames/coolname` without updating `/users/{uid}.username` atomically -> `PERMISSION_DENIED` (`getAfter` check).
9. **Deleting Another User's Handle**: Delete `/usernames/other_user` -> `PERMISSION_DENIED` (`existing().uid == request.auth.uid`).
10. **Unbounded Array Injection**: `unlockedSkins` with 25 items -> `PERMISSION_DENIED` (`size() <= 20`).
11. **Invalid Username Format**: `username: "bad name!"` (spaces/punctuation) -> `PERMISSION_DENIED` (regex mismatch).
12. **Blanket List Scraping**: `list` query on `/users` or `/usernames` -> `PERMISSION_DENIED` (`allow list: if false;`).
