# Security Specification - Prism of Life

## Data Invariants
1. **Events**:
   - Must have a `title`, `description`, `date`, `ownerId`.
   - `ownerId` must match the creator.
   - `participants` must include the owner.
   - `status` can be 'draft' or 'published'.
2. **Users**:
   - User profiles can only be created/edited by the user themselves.
   - Email must match `request.auth.token.email`.

## The Dirty Dozen (Attack Payloads)
1. **Id Spoofing**: Attempt to create an event with `ownerId` set to another user's UID.
2. **Unauthorized Update**: A non-participant attempting to edit an event.
3. **Privilege Escalation**: A participant attempting to delete an event they don't own.
4. **Metadata Poisoning**: Injecting a 1MB string into the `title` field.
5. **ID Poisoning**: Using a 1.5KB string as a document ID.
6. **Relational Break**: Creating an event without a valid owner profile.
7. **PII Leak**: Non-admin attempting to list all user profiles with full details (if PII is present).
8. **Status Bypass**: Attempting to set an event to 'featured' when that's a system-only status.
9. **Creation Shadowing**: Adding a hidden `isAdmin: true` field to a user profile.
10. **Ghost Participant**: Adding oneself to an event without owner consent (if not public).
11. **Timestamp Spoofing**: Providing a `createdAt` date from 2001.
12. **Orphaned Write**: Updating a sub-collection for a non-existent parent event.

## Test Matrix
- [ ] `createEvent` rejected if `ownerId` != `request.auth.uid`.
- [ ] `updateEvent` rejected if user is not in `participants` list.
- [ ] `deleteEvent` rejected if user is not `ownerId`.
- [ ] `writeUser` rejected if `userId` != `request.auth.uid`.
- [ ] All writes rejected if strings exceed size limits.
