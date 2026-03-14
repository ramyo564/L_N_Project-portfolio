# Case4 Evidence Manifest

> purpose: 포트폴리오 Case4 화면에 쓰이는 파일과 내부 원천 증거 경로를 1:1로 매핑한다.
> last_updated: 2026-03-14

## A) Derived Summary Images (Portfolio Friendly)

| portfolio file | role | source of truth |
|---|---|---|
| `./before/case4-phase-a-matrix-before-2026-03-13.svg` | `C3/C4 완화축` 요약 카드 | `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-13/compare.md`, `./before/c3/summary.txt`, `./before/c4/summary.txt` |
| `./before/case4-phase-b-fail-control-before-2026-03-13.svg` | fail/control 재수집 요약 카드 | `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-13/compare.md` |
| `./after/case4-phase-c-matrix-after-2026-03-14.svg` | 최신 브랜치 2x2 matrix 요약 카드 | `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-14/after/compare.md` |
| `./after/case4-phase-c-codepath-after-2026-03-14.svg` | 코드 경로 소거 + complete 판정 카드 | `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-logic-flow.md`, `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-final-status-2026-03-14.md`, `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/canonical-claim-ledger.md` |
| `./after/web-dashboard-img/after-vt-true-redis-true.png` | 2x2 matrix dashboard 보조 캡처 | `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-14/after/web-dashboard-img/after-vt-true-redis-true.png` |
| `./after/web-dashboard-img/after-vt-true-redis-false.png` | 2x2 matrix dashboard 보조 캡처 | `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-14/after/web-dashboard-img/after-vt-true-redis-false.png` |
| `./after/web-dashboard-img/after-vt-false-redis-true.png` | 2x2 matrix dashboard 보조 캡처 | `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-14/after/web-dashboard-img/after-vt-false-redis-true.png` |
| `./after/web-dashboard-img/after-vt-false-redis-false.png` | 2x2 matrix dashboard 보조 캡처 | `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-14/after/web-dashboard-img/after-vt-false-redis-false.png` |

## B) Raw Archive Images (Original Captures)

| portfolio file | role | source of truth |
|---|---|---|
| `./before/c3/c3-k6.png` | C3 raw k6 캡처 | `./before/c3/report.html`, `./before/c3/mvc-task-subtask-fixed-user-load-test-summary.json` |
| `./before/c4/c4-k6.png` | C4 raw k6 캡처 | `./before/c4/report.html`, `./before/c4/mvc-task-subtask-fixed-user-load-test-summary.json` |
| `./before/c3/c3-redis.png` | C3 Redis 패널 | `./before/c3/root-cause.txt` |
| `./before/c4/c4-redis.png` | C4 Redis 패널 | `./before/c4/root-cause.txt` |
| `./before/c3/c3-postgres.png` | C3 Postgres 패널 | `./before/c3/root-cause.txt` |
| `./before/c4/c4-postgres.png` | C4 Postgres 패널 | `./before/c4/root-cause.txt` |
| `./before/c3/c3-rmq.png` | C3 RabbitMQ 패널 | `./before/c3/root-cause.txt` |
| `./before/c4/c4-rmq.png` | C4 RabbitMQ 패널 | `./before/c4/root-cause.txt` |

## C) Canonical Hub Links

1. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/README.md`
2. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-logic-flow.md`
3. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-final-status-2026-03-14.md`
4. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-source-index.md`

## D) Usage Notes

1. Case4 공개 설명은 반드시 `Phase A(완화) -> Phase B(보류) -> Phase C(complete)` 순서를 유지한다.
2. 숫자/판정 문구는 `canonical-claim-ledger.md` CASE-4 row를 우선한다.
3. 요약 SVG는 전달용 파생 산출물이며, 분쟁 시 원천 판정은 허브 문서를 기준으로 한다.
