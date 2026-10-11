# MMinCare — synchronized documentation release

**Cập nhật:** 2026-10-11 (VN) · **Application baseline:** `main` `bcd14b51f4b70cd3d418bd10638f7a996713fdcf`  
**Đã triển khai:** PR #26 đã merge, [Vercel Production success](https://vercel.com/lemai-rgbs-projects/m-mincare/E3bmui2BdzU7iAzkP2kNtnM4XSLD).  
[Ứng dụng](https://m-mincare.vercel.app/) · [Trải nghiệm thử](https://m-mincare.vercel.app/demo)

## Current set

| Artifact | Purpose |
|---|---|
| [Architecture_Decision_Log.md](../Architecture_Decision_Log.md) | ADL decisions and current/future boundary |
| [MMinCare_API_Documentation.md](../MMinCare_API_Documentation.md) | Actual route/payload/response contracts |
| [Data_Dictionary.md](../Data_Dictionary.md) | Exact fields/FKs, migrations, Storage and demo distinction |
| [MMinCare_Business_Rules.md](../MMinCare_Business_Rules.md) | Preserved BR IDs and delivered rules |
| [ERD-WEB-MMinCare.drawio](../ERD%20-%20WEB%20MMin%20Care.drawio) | 3 editable logical ERD views |
| [Use-Case-MMinCare.drawio](../Use%20Case_MMinCare.drawio) | 3 editable Owner/demo scope pages |
| [User-flow-MMinCare.drawio](../Product/User%20flow%20Web%20theo%20d%C3%B5i%20th%C3%BA%20c%C6%B0ng.drawio) | 4 editable flow pages including canonical recovery |
| [User-story.md](../Product/User%20story.md) | Preserved US-01…17 plus US-18…23 |
| [MVP-document.md](../Product/MVP%20document.md) | Delivered scope, original MoSCoW and acceptance/evidence |
| [Problem-statement.md](../Product/Problem%20statement.md) | Problem hypotheses and reported feedback |
| [Persona-Document.md](../Product/Persona%20Document.md) | Constructed personas, not interview participants |

## What changed

- Superseded append-only/no-delete/pending-chart/demo-planned claims with actual delivered behavior.
- Corrected fields and API methods against current handlers/migrations; retained BR/US/ADL IDs and historical records.
- Documented same-UI public demo with per-tab isolation,3 Pets/31 logs, supplied photos/fallback and varied status histories.
- Kept Google/Caretaker/push-email/aggregate as Planned, and CR-08 access/dataset outstanding.
- Distinguished accepted implementation, automated checks, sampled production smoke and pending real-service/mobile/performance tests.

Documentation-only release: no application code, dependencies, schema/grants/migration or production data changes. Dated code review is preserved with a pointer to current dispositions. Application SHA above is a source baseline, not the docs commit SHA.
