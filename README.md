# MMinCare

**Care more, worry less.** A pet-care record management web application and an independent portfolio project for **Business Analysis, Product/Project Management, and Software Testing**.

MMinCare helps dog and cat owners keep pet profiles, vaccination history, medical records, health observations, and care reminders in one place. It does not diagnose conditions or replace veterinary advice.

[Live application](https://m-mincare.vercel.app/) · [Portfolio Demo guide](docs/PORTFOLIO_DEMO.md) · [Sample dataset](demo/README.md) · [Project status](docs/PROJECT_STATUS.md) · [BA/PM/Tester evidence](docs/PORTFOLIO_EVIDENCE.md)

> **Status — 10 October 2026:** PRs #18–#25 merged. The public `/demo` was published with a separate sandbox UI; this follow-up replaces it with the same application components, forms and styles. The correction is not yet deployed. Demo data stays browser-local and does not establish real Auth/Storage/RLS QA.

## Problem and intended users

Pet information is often scattered across vaccination books, prescriptions, clinic messages, photos, calendars, and personal notes. Owners need a chronological record to find past care events, track changes, and remember upcoming care dates.

The initial scope prioritizes an owner managing dogs or cats. Shared Caretaker access is a future extension, not a current production permission.

## Portfolio guide

| Focus | Evidence available in this repository |
|---|---|
| BA | [Problem statement](Product/Problem%20statement.md), [personas](Product/Persona%20Document.md), [MVP and MoSCoW](Product/MVP%20document.md), [business rules](MMinCare_Business_Rules.md), [API design/current route inventory](MMinCare_API_Documentation.md), [data dictionary](Data_Dictionary.md), [Use Case](Use%20Case_MMinCare.drawio), [ERD](ERD%20-%20WEB%20MMin%20Care.drawio) |
| PM/Product | [Delivery status and prioritized backlog](docs/PROJECT_STATUS.md), [architecture decisions](Architecture_Decision_Log.md), merged feature/fix PRs, scope changes based on user feedback |
| Tester/QA | [Requirement-to-test mapping and manual scenarios](docs/PORTFOLIO_EVIDENCE.md), automated regression tests, migration/RLS assertions, [defect report and verification limits](docs/CODE_REVIEW_2026-10-07.md) |

This is an independent project with AI-assisted implementation and review. Repository artifacts demonstrate project work; they do not imply professional employment, a production security certification, or a measured business outcome.

## Implemented Owner workflows

| Area | Current capability |
|---|---|
| Authentication | Email/password signup, email confirmation and resend feedback, login/logout, password recovery, protected sessions |
| Pet profiles | Create, view, edit; optional private JPEG/PNG/WebP upload up to 5 MB; change/remove photo; species avatar fallback; real photos fill a square frame |
| Vaccination and medical history | Record completed vaccinations and medical visits; optional private medical attachments; Owner-confirmed deletion of vaccine/medical records; no edit UI for these records |
| Reminders | Manual or vaccine/medical-linked reminders; Upcoming/Overdue/Completed views; edit eligible Upcoming reminders and mark completed |
| Notification Center | Current in-app events, unread red dot, read/retry state and navigation to the linked reminder |
| Health journal | Create, edit, delete dated weight/food/condition/note observations; deletion confirmation; Enter in the three measurement/food inputs does not save |
| Health summaries | Compact latest-journal summary on pet cards; per-pet weekly/monthly statistics |
| Data access | Authenticated Owner checks in APIs, database RLS, private Storage and Owner-authorized photo delivery |

**Typical flow:** register and confirm email → create a pet → record care and health observations → set reminders → review notifications and complete tasks → review history/statistics.

## Business decisions

- A vaccination record describes an event that happened; future dates are rejected. Optional next-date suggestions are currently unavailable because of rule access/data setup (CR-08); when available, they must not silently create reminders.
- A reminder is manual or linked to one vaccine/medical source. Overdue is derived from due date; stored status remains Upcoming until completion.
- Health logs separate the selected business date (`recorded_on`) from the immutable creation timestamp (`logged_at`).
- Optional photos can be removed without making a profile invalid. Private pet photos use an authorized API; medical attachments use authorized signed URLs.
- Medical/vaccine deletion handles linked reminders; medical deletion reports attachment-cleanup warnings. Pet/account hard deletion is not implemented.
- Caretaker sharing, OAuth, proactive email/push reminders and multi-pet aggregate analytics are not shipped.

## Delivery and quality

Current demo base: [`fd7145e`](https://github.com/lemai-rgb/MMincare/commit/fd7145ef7ad72f3bda7fe36613f88e5f22a795cd), after [PR #23](https://github.com/lemai-rgb/MMincare/pull/23). PR #22 fixed Health Log/Notification request lifecycle and idempotency; PR #23 updated mobile layout. Authenticated manual QA and production timings remain unverified. The following results are historical evidence from the earlier `8b91154` review, not new results for this demo branch.

Checks performed on 7 October 2026:

- **45 Vitest tests across 11 files passed**, including notifications, photo picker, Health Log UI/API, timeout/retry and validation scenarios.
- Auth error/resend, Reminder edit, Notification selector/reducer and HTTP-timeout script tests passed.
- ESLint, TypeScript and a production build passed.
- Latest relevant [migration replay run #23](https://github.com/lemai-rgb/MMincare/actions/runs/37615187127) passed on the PR #20 feature head. The workflow is path-filtered; not every check runs on every PR.
- Vercel reports successful deployment for the reviewed main commit. Deployment success does not establish loading speed or authenticated functional correctness.

**Quality follow-up:** request lifecycle/race/text-validation fixes were delivered by PR #22; optional vaccine rule access/dataset remains incomplete (CR-08). Timestamp range validation in statistics was fixed by merged PR #24. Focus recovery, CI coverage, database advisory follow-up and manual evidence should retain their verified status rather than infer completion from deployment. See the [dated review](docs/CODE_REVIEW_2026-10-07.md) and [current status](docs/PROJECT_STATUS.md).

Authenticated upload/reload, cross-Owner access, real email flows, desktop/mobile visual QA and production timings are not verified in this review. See the [manual scenarios](docs/PORTFOLIO_EVIDENCE.md).

## Architecture and stack

```mermaid
flowchart TD
    O[Owner] --> W[Next.js pages and API routes]
    W --> A[Supabase Auth]
    W --> D[Postgres with RLS]
    W --> S[Private Storage]
```

Next.js 16.3.5 · React 19.2.4 · TypeScript · CSS modules/Tailwind CSS 4 · Supabase Auth/Postgres/Storage · Vercel · Vitest/Testing Library.

APIs validate authentication and pet ownership; RLS supplies a database authorization boundary. The deployed API uses `/api/...` with SSR cookie sessions. Original API examples are design material; current routes are marked separately in the [API document](MMinCare_API_Documentation.md).

## Repository navigation

| Directory/file | Purpose |
|---|---|
| `Product/` | Problem statement, personas, original MVP prioritization |
| `docs/` | Current status, portfolio traceability/manual scenarios, dated review |
| `app/`, `components/`, `styles/` | Pages, route handlers, feature/shared UI and styles |
| `lib/` | Auth, domain validation, request lifecycle and Supabase helpers |
| `supabase/migrations/` | Versioned migrations; reconcile with remote history before applying |
| `supabase/ci-legacy-baseline.sql` | Legacy snapshot used only by local CI replay |
| `database/` | Schema reference and legacy material; not a second migration source |
| `.github/workflows/` | Migration replay and database assertions |

## Run locally

Requirements: Node.js 20.9+ (CI uses Node 22), npm, and a configured Supabase development project.

```bash
git clone https://github.com/lemai-rgb/MMincare.git
cd MMinCare
npm ci
```

Create `.env.local` using your development project's public settings:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

```bash
npm run dev
```

Open `http://localhost:3000`. Do not expose secret/service-role keys in browser code or `NEXT_PUBLIC_` settings. Do not use production user data as test fixtures.

Available checks:

```bash
npm run test:auth
npm run test:reminders
npm run test:notifications
npm run test:pet-images
npm run test:performance
npm run test:demo
npm run demo:export -- --date 2026-10-10
npx vitest run lib/petHealthSummary.test.ts
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

The summary test is listed separately because it is not included in an npm test script. See the review for CI gaps.

## Deployment and remaining scope

Configure Supabase Site URL/auth redirects, reconcile migrations, and verify private `pet-photos` and `medical-record-attachments` buckets/policies before release. Pet-photo and Health Log edit/delete migrations are already recorded in production at this checkpoint; do not apply them again just to run the project.

Optional `MINCARE_PERF_LOG=1` enables server timing logs with request/stage identifiers and durations. Actual production before/after timings have not been captured; no speed improvement percentage is claimed.

This branch's `/demo` uses only synthetic client data, no backend credentials, and exposes selected Health Log/Reminder/Notification interactions. The real application still needs its configured Supabase environment. See [demo scope and acceptance](docs/PORTFOLIO_DEMO.md) before using a demo URL on a CV. Future scope includes controlled sharing, external notifications, OAuth and multi-pet analytics.

## Portfolio access

The live application uses real authenticated workflows; `/demo` in this branch provides synthetic data for recruiters without account registration. Use its public URL on a CV only after deployment is verified. The repository was private at the earlier audit; its URL alone does not grant recruiter access. Decide visibility/access explicitly before sharing code/documentation. Demo fixtures and tests do not establish real Owner isolation or production performance.
