# NEXUS OS Security Specification

## 1. Data Invariants
1. Deny-by-default: Every path outside explicit rules is strictly inaccessible.
2. Verified Owner Only: All read, write, create, update, delete operations across all collections require `request.auth != null`, `request.auth.token.email_verified == true`, and `request.auth.token.email == 'nexuspremiumsolutions@gmail.com'`.
3. Identity Integrity: Any write must set `ownerId == request.auth.uid` and `ownerEmail == request.auth.token.email`.
4. Relational Integrity: Subcollection interactions `/prospects/{prospectId}/interactions/{interactionId}` must belong to an existing parent prospect owned by the user.
5. Immutability: `ownerId`, `ownerEmail`, and `createdAt` cannot be modified upon update.
6. Finite Boundaries: All strings must satisfy length constraints (max lengths defined in `firebase-blueprint.json`).
7. ID Validation: Document IDs must strictly match `^[a-zA-Z0-9_\-]+$` and have size `<= 128`.
8. No Public or Blanket Access: Unauthenticated users or non-owner Google accounts have zero read or write access.

## 2. The "Dirty Dozen" Threat Payloads

1. **Unauthenticated Read Request**: Attempting to list `/prospects` without Firebase Auth token. Expected: `PERMISSION_DENIED`.
2. **Unverified Email Write**: Authenticated user with `email_verified: false` attempting to create `/prospects/p1`. Expected: `PERMISSION_DENIED`.
3. **Foreign User Account Spoofing**: Authenticated user with email `attacker@evil.com` trying to read `/offers`. Expected: `PERMISSION_DENIED`.
4. **Owner ID Spoofing Attack**: Authenticated owner sending `ownerId: "someone-else-uid"` in `request.resource.data`. Expected: `PERMISSION_DENIED`.
5. **Ghost Field Injection (Shadow Update)**: Sending `{ isSuperAdmin: true, company: "ACME" }` on update. Expected: `PERMISSION_DENIED`.
6. **Path ID Poisoning**: Creating document at `/prospects/../../etc/passwd` or with 2KB string ID. Expected: `PERMISSION_DENIED`.
7. **Immortal Field Mutation**: Attempting to alter `createdAt` or `ownerId` on an existing task. Expected: `PERMISSION_DENIED`.
8. **Denial of Wallet Payload**: Submitting a 50MB string inside `needsSummary`. Expected: `PERMISSION_DENIED`.
9. **Orphan Interaction Sub-Resource**: Writing to `/prospects/non-existent-id/interactions/i1` when parent prospect does not exist. Expected: `PERMISSION_DENIED`.
10. **State Shortcutting with Invalid Enum**: Setting prospect status to `HACKED_STATUS`. Expected: `PERMISSION_DENIED`.
11. **Client Delegation Query Scraping**: Attempting an unrestricted collection query across other users' data. Expected: `PERMISSION_DENIED`.
12. **Settings Escalation**: Modifying owner settings from a non-owner identity. Expected: `PERMISSION_DENIED`.

## 3. Test Runner Design
The rules will be verified against the strict condition `request.auth.token.email == 'nexuspremiumsolutions@gmail.com' && request.auth.token.email_verified == true`.
Any request not originating from this verified owner account is rejected with `PERMISSION_DENIED`.
