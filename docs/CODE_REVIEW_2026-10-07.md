# Code review —7 October2026 (historical checkpoint)

> **Read this as dated evidence.** Application main bcd14b5 (11 October2026 VN) supersedes this baseline. CR-01/02/03 were delivered in PR #22; CR-08 status contract was corrected but rule access/dataset is still outstanding. Other findings were not re-certified here. Current dispositions and verification limits: [Project status](PROJECT_STATUS.md). Original observations and test counts below are preserved.

**Baseline:** [`8b911540ddfb4856d29f414f1e771f0ae22dc989`](https://github.com/lemai-rgb/MMincare/commit/8b911540ddfb4856d29f414f1e771f0ae22dc989)  
**Scope:** targeted review of Auth/session boundaries, Owner routes/RLS, private Pet/Medical files, Reminder/Notification state, Health Log mutations, loading, tests and documentation.

## Assessment

Lint, TypeScript, production build and existing targeted tests passed. This is **not** a whole-site sign-off. Two defects were reproduced locally with mocks; source/lifecycle/coverage issues remain; authenticated real-service, visual and performance QA was not performed. No confirmed critical authorization bypass was found in reviewed paths; no penetration test was performed.

This update changes documentation only. Fixes remain open; production settings/data were read without modification.

## Findings

### CR-01 — Save/delete/notification UI can remain pending indefinitely

**Severity:** Medium · **Priority:** P1 · **Evidence:** source inspection.

- `components/pets/HealthLogCreateForm.tsx`: submit has unbounded `fetch()`, no abort signal/timeout; a never-settling request keeps the submit guard active.
- `components/pets/PetHealthHistory.tsx`: DELETE aborts on unmount but has no mounted request deadline.
- `components/layout/NotificationCenter.tsx`: GET/read PATCH have abort/sequence checks but no timeout.

The existing 15-second helper protects several read flows, not these operations. An indefinitely pending response cannot enter the error/finally branches. This fits a loading risk, but does not prove the cause of observed production delay.

**Acceptance:** bounded waiting, pending state released, actionable errors, cleanup and stale-response protection. A mutation timeout does not prove server failure: reconcile canonical data/idempotency before retrying create to avoid duplicates. Test never-resolving requests.

### CR-02 — Older Health Log GET overwrites a successful mutation

**Severity:** Medium · **Priority:** P1 · **Evidence:** local mocked UI reproduction.

`PetHealthHistory.tsx` replaces the list when GET resolves. Create/edit/delete update local rows without invalidating the GET generation. `router.refresh()` does not guarantee a reload of the effect, whose dependencies remain `activeView`, `petId`, `reloadToken`.

**Reproduced:** form opens while initial GET is pending → POST returns one created log → return to history → earlier GET returns an empty pre-create snapshot → UI displays “Chưa có dữ liệu sức khỏe”. This is loss of displayed state, not loss of the saved database row. Edit/delete share the uninvalidated boundary but were not independently reproduced.

**Acceptance:** pre-mutation GET cannot replace post-mutation state; invalidate/abort and deliberately revalidate. Test create/edit/delete against out-of-order responses.

### CR-03 — Valid literal `invalid` is treated as a type error

**Severity:** Low · **Priority:** P2 · **Evidence:** local API reproduction.

Both Health Log validators use string `"invalid"` as a sentinel for non-string input, although it can also be user text:

- `app/api/pets/[petId]/health-logs/route.ts`: normalization and POST checks.
- `app/api/pets/[petId]/health-logs/[healthLogId]/route.ts`: normalization and PATCH checks.

Authenticated mocked PATCH with `{ "note": "invalid" }` returned 400 before database lookup. Equivalent POST collision is visible in source; not separately runtime-tested.

**Acceptance:** distinguish validation state from text with an explicit type check/discriminated result/Symbol; cover literal text, invalid types, whitespace and nullable clearing in create/edit.

### CR-04 — Post-delete focus targets a removed button

**Severity:** Low · **Priority:** P2 · **Evidence:** source inspection.

Successful Health Log deletion removes the row, then the closing-dialog effect focuses its saved trigger, now detached from the document. Cancel/error retains a trigger; successful deletion needs a keyboard focus fallback.

**Acceptance:** focus an existing next/previous row action, heading or add button; verify cancel and successful deletion.

### CR-05 — Ordinary source PRs do not enforce the full application checks

**Severity:** Medium (release-process risk) · **Priority:** P2 · **Evidence:** workflow/script inspection.

`supabase-migration-replay.yml` is triggered by migration/config/schema/workflow paths or manually, and runs Notification tests after database assertions. It does not enforce Auth, Pet image, performance/Health Log, lint or TypeScript on every source PR. `lib/petHealthSummary.test.ts` is absent from npm test scripts.

Vercel build/migration CI alone does not establish full regression coverage. Branch protection was not changed or assumed.

**Acceptance:** appropriate application workflow/source path coverage, explicit summary tests and required checks where configured.

### CR-06 — Database advisories require measured follow-up

**Severity:** Low to Medium · **Priority:** P2 · **Evidence:** read-only Supabase performance advisor.

- Three duplicate-index groups: medical attachment `record_id`, medical record `created_by`, vaccine record `created_by`.
- Multiple permissive Reminder UPDATE policies: `reminders_owner_edit`, `reminders_owner_update`.
- Eighteen unused-index notices (informational).

These do not establish the cause of slow loading. Review definitions, constraints, policy semantics and query plans before migration proposals; preserve access/transition rules. Do not remove indexes solely because unused.

[Duplicate-index guidance](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index) · [Policy guidance](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) · [Unused-index guidance](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

### CR-07 — Auth hardening and future-table notices

**Type:** configuration limitation/advisory · **Evidence:** read-only Supabase security advisor.

Leaked-password protection is disabled. Supabase documents this feature as Pro-plan-and-above; check plan constraints before proposing a change. This is a hardening limitation, not a confirmed compromise/code regression. No plan/settings change was made.

RLS-without-policy notices exist for `pet_access` and `vaccine_schedule_rules`. They do not grant general client access. Sharing is not implemented. The schedule-table notice also exposes a feature-access mismatch detailed in CR-08. Do not add broad policies just to silence notices.

[Password-security docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) · [RLS/no-policy notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

### CR-08 — Vaccine schedule suggestions have no usable production rule source

**Severity:** Medium (feature availability) · **Priority:** P2 · **Evidence:** source plus read-only production privilege/aggregate query.

`app/api/pets/[petId]/vaccines/route.ts` queries `vaccine_schedule_rules` using the user's SSR/publishable-key client. The route silently returns no suggestion when the query errors. Production inspection found `authenticated` SELECT privilege false, RLS enabled, no policies and zero rule rows. The migration/schema intentionally revoke client access; the route does not use a dedicated authorized function.

Consequently the optional suggested next date is unavailable at this checkpoint, even though the design describes it. Saving a completed vaccination still works independently. The empty rule dataset was observed only; its origin/history was not investigated or changed.

**Acceptance:** define an approved read-only access contract for non-personal schedule rules (or a narrowly authorized server/database function), supply a reviewed rule dataset, and distinguish “no matching rule” from an internal permission/configuration failure. Preserve no automatic reminder creation and missing-DOB fallback. Do not use a client-exposed service-role key or broad grants.

## Evidence and limits

| Check | Result |
|---|---|
| Existing targeted Vitest suite | 45 tests / 11 files passed |
| Auth mapper/resend, Reminder edit, Notification selector/reducer scripts | Passed |
| HTTP timeout lifecycle script | Passed |
| ESLint / TypeScript / Next.js production build | Passed; font download did not block this environment |
| CR-02/CR-03 reproductions | Confirmed with two temporary mocked tests; original test files restored |
| GitHub migration run #23 | Passed on PR #20 feature head; not a full current-main workflow |
| Reviewed-main Vercel deployment | Success status; not a functional/speed claim |
| Authenticated upload/mutation/visual QA and production timing | Not performed |

The sandbox blocked `tsx` CLI IPC. Equivalent scripts ran with `node --import tsx`; Vitest used its Node entry point. No test/runtime files are changed by this documentation update.

## Next verification

Fix CR-01–CR-03 with deterministic tests, then rerun affected checks. Capture production request timings before assigning delays to code/Vercel/Supabase; use privacy-safe `MINCARE_PERF_LOG=1` stage logs where appropriate. Execute [manual scenarios](PORTFOLIO_EVIDENCE.md) with synthetic records and two Owner sessions. This document is not manual test execution evidence.
