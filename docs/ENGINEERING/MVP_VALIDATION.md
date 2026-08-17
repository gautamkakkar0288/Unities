# MVP Manual Validation Script

> **Status: automated tests pass; browser validation NOT YET RUN.**
> Machine running validation (2026-08-17) has no local PostgreSQL instance.
> Browser flows require `DATABASE_URL`, `AUTH_SECRET`, and a seeded database.
> All automated checks (typecheck, lint, 268 unit+component tests, build) pass.
> Browser validation must be completed by a developer with a working `.env.local`.
>
> Do not mark Phase 3 complete until section 5 passes in a browser.


## Why this file exists

The test suite exercises `lib/services/*` directly. The pages that call those
services are typechecked and built, but no test opens them. The gap is
specifically: server action wiring, `revalidatePath` behaviour, form submission,
redirects, session/role reading in layouts, and every empty/error state.

## Setup

```bash
git checkout main && git pull
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

`.env.local` needs `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`.

With the console email transport, verification links are printed to the terminal
running `npm run dev`. Copy them from there.

Keep a `psql` session open. Several steps below are only meaningful if the
database agrees with the screen.

Use three browser profiles (or one plus two incognito windows) so three sessions
coexist: **Student A**, **Student B**, **Admin**.

---

## 1. Student sign-up and onboarding — Student A

| Step | Expected |
| --- | --- |
| Open `/` | Landing page renders |
| Sign up with a non-`@chitkara.edu.in` address | **Refused.** Only `@chitkara.edu.in` may sign up |
| Sign up with `a@chitkara.edu.in` | Account created, verification email printed to terminal |
| Try to reach `/home` before verifying | Behaviour must match the gating decision recorded in section 7 |
| Open the verification link | `users.email_verified` becomes non-null |
| Sign in | Session established |
| Onboarding: pick interests | Rows appear in `user_interests` |
| `/home` | Renders real data, no placeholder content |
| `/communities` | Seeded communities listed with real member counts |
| Open a community | Detail page renders |
| Join an `OPEN` community | Button flips to joined; `memberships` row `MEMBER`; `communities.member_count` incremented by exactly 1 |
| Reload | Joined state persists |
| Leave | Row and counter both revert |
| `/profile` | Shows the real account and its interests |

Check: `select member_count from communities where slug = '…'` matches the
number of `MEMBER`/`MODERATOR`/`OWNER` rows. A drifting counter here is the
bug most likely to be invisible in the UI.

---

## 2. Community creation and organiser verification — Student B

Requires PR #18.

| Step | Expected |
| --- | --- |
| Sign up `b@chitkara.edu.in`, verify, onboard | as above |
| Propose a community | `community_proposals` row, `PENDING` |
| As Admin, approve it | `communities` row created, `created_community_id` set, proposer is `OWNER` in `memberships` |
| As B, submit a verification request with evidence | `verification_requests` row, `PENDING` |
| Submit a second request for the same community | **Refused** — partial unique index |
| As Admin, open the queue | Request visible, oldest first |
| Approve | `communities.verification` → `VERIFIED`; owner's `users.role` → `ORGANIZER`; `audit_log` row written |
| Approve the same request again | **Refused** — already decided |

Rejection path, on a second community:

| Step | Expected |
| --- | --- |
| Request, then reject with a note | `status` `REJECTED`, `reviewer_note` stored |
| Check the community | `verification` still `UNVERIFIED` |
| Check the owner | `role` **still `STUDENT`** — rejection must not promote |
| Request again after rejection | **Allowed** |

Check: `select action, target_kind, summary from audit_log order by created_at`.
Every approve and reject must be there. A missing row means the write was not in
the same transaction.

---

## 3. Event creation — Student B, now an organiser

Requires PR #19.

| Step | Expected |
| --- | --- |
| `/create` | Event card offers "Choose a community" |
| Pick the verified community, open its new-event form | Form renders |
| Submit with `ends_at` before `starts_at` | **Refused**, readable message |
| Submit with a start time in the past | **Refused** |
| Submit with registration closing after the start | **Refused** |
| Submit a valid event, capacity 10 | Created and published |
| `/events` | Appears in discovery, correct time bucket |
| Open its detail page | Title, description, date, time, venue, capacity, host community, mode all correct |
| Try to create an event on the **unverified** community | **Refused** — only owners of verified communities may publish |

---

## 4. Registration — Student A

| Step | Expected |
| --- | --- |
| Find the event in `/events` | Visible |
| Register | Confirmation state, not a toast that lies |
| **Reload** | Still registered — this is the step that catches missing revalidation |
| Check `event_registrations` | One row, `REGISTERED` |
| Check `events.registered_count` | Exactly 1 |
| Cancel | State reverts, counter back to 0, row `CANCELLED` (not deleted) |
| Register again | Same row reused, `REGISTERED` again |

---

## 5. Capacity-1 waitlist promotion — **the critical test**

Create an event with **capacity 1**.

| Step | Actor | Expected |
| --- | --- | --- |
| Register | Student A | `REGISTERED`, `registered_count` = 1 |
| Open the event | Student B | Button reads **"Join the waitlist"** and is **enabled** — full is not closed |
| Join the waitlist | Student B | `WAITLISTED`. `registered_count` **stays 1** — waitlisters do not consume seats |
| Cancel | Student A | A's row `CANCELLED` |
| **Reload as Student B** | Student B | **B is now `REGISTERED`**, `promoted_at` set, `registered_count` = 1 |

If `registered_count` reaches 2 at any point, the event is oversold and Phase 3
is not complete. If B is not promoted, the transaction is wrong.

Also confirm B's `created_at` is unchanged by promotion — it is the queue key,
and a promoted student keeps the timestamp that earned them the seat.

Then cancel the event as the organiser: both registration rows must **survive**,
so those students can be notified in Phase 4.

---

## 6. Negative testing

**Student A (plain student) must not be able to:**

- reach an event creation form, or succeed by posting to it directly
- open `/events/[slug]/manage` for anybody's event
- open the admin verification queue
- approve or reject a verification request
- change their own `users.role`

**Organiser B must not be able to:**

- manage an event belonging to another community
- promote themselves to any admin role
- publish from a community they do not own, or one that is unverified

**Admin must not be able to:**

- approve a verification request for their own community
- create another admin through the role-management flow

Test each by URL as well as by button. A guard that only hides a link is not a
guard; authorisation lives inside the services and this is where that gets
proven.

---

## 7. Verification gating decision

Record the final answer here once implemented, then keep this table and the code
in step.

| Capability | Unverified | Verified student | Organiser | Admin |
| --- | --- | --- | --- | --- |
| Sign in, manage account, resend verification | ✅ | ✅ | ✅ | ✅ |
| Complete onboarding | tbd | ✅ | ✅ | ✅ |
| Join a community | ❌ | ✅ | ✅ | ✅ |
| Propose a community | ❌ | ✅ | ✅ | ✅ |
| Register for an event | ❌ | ✅ | ✅ | ✅ |
| Create an event | ❌ | ❌ | verified community only | ❌ |
| Review verification requests | ❌ | ❌ | ❌ | ✅ |

---

## 8. Record the outcome

For each section: pass, fail, or not run. **"Not run" is a legitimate and
useful result — it is not the same as pass.** File a real issue for every
failure rather than patching around it, and note which ones block the closed
pilot.

---

### Outcome — 2026-08-17

**Environment:** Windows 10, `main` at commit `83137a3`, no local PostgreSQL.

**Blocker for browser validation:** No `DATABASE_URL` or `AUTH_SECRET` present
in the environment. The application requires a seeded PostgreSQL instance to
start. All browser sections below are therefore NOT RUN — not failed; not
assumed to pass.

**Automated checks (all passed before browser testing was attempted):**

| Check | Result |
|---|---|
| `npm run typecheck` | PASS — 0 errors |
| `npm run lint` | PASS — 0 errors, 3 warnings (all in test files) |
| `npm test` | PASS — 268 passed, 142 skipped (DB integration tests need live Postgres) |
| `npm run build` | PASS — clean Next.js production build |

**Browser validation results:**

| Section | Result | Notes |
|---|---|---|
| 1. Student sign-up and onboarding | NOT RUN | Needs DATABASE_URL + seeded DB |
| 2. Community creation and organiser verification | NOT RUN | Needs DATABASE_URL + seeded DB |
| 3. Event creation | NOT RUN | Needs DATABASE_URL + seeded DB |
| 4. Registration | NOT RUN | Needs DATABASE_URL + seeded DB |
| 5. **Capacity-1 waitlist promotion** | **NOT RUN** | **Critical test — must be run before Phase 3 is declared complete** |
| 6. Negative testing | NOT RUN | Needs DATABASE_URL + seeded DB |

**Email status:**

- Console transport: working (prints verification link to server log)
- SMTP transport: implemented (Nodemailer, `lib/email/smtp-transport.ts`)
- Production SMTP delivery: NOT TESTED — no credentials available
- To test: add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` to `.env.local`

**To run browser validation:**

```bash
# 1. Copy and fill in credentials
cp .env.example .env.local
# Add: DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL=http://localhost:3000

# 2. Apply migrations and seed
npm run db:migrate
npm run db:seed

# 3. Start app
npm run dev

# 4. Follow sections 1–6 above using three browser profiles
#    (Student A, Student B, Admin)
#    Pay special attention to Section 5 (capacity-1 waitlist)
```

