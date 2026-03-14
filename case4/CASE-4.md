# Case 4. C3/C4 완화축 식별에서 2x2 재검증 complete closure까지

> 기준일: 2026-03-14
> canonical status: `complete (latest-branch verification complete)`
> timeline scope: `2026-03-13` + `2026-03-14`

## 요약

Case4는 한 번에 끝난 before/after 케이스가 아니라 3단계로 닫혔다.

1. `2026-03-13` C1~C4 매트릭스에서 `C3(VT=true, share=false)` 대비 `C4(VT=true, share=true)`의 완화축을 먼저 식별했다.
2. 같은 날 fail/control 재수집으로 사용자 지표 회복은 확인했지만, 내부 Redis 예외 잔존으로 complete를 보류했다.
3. `2026-03-14` 최신 브랜치 2x2 matrix(vt/redis) + 코드 경로 검증에서 장애 시그니처 소거를 확인하고 complete로 종료했다.

## Phase Timeline

### Phase A. C1~C4 조합 비교 (2026-03-13)

| Case | VT | share-native | `http_req_failed.rate` | `checks.rate` | req/s | method_error | redis_conn_failure |
|---|---|---|---:|---:|---:|---:|---:|
| C3 | true | false | 0.0106 | 0.9908 | 442.77 | 524 | 0 |
| C4 | true | true | 0.0000 | 1.0000 | 804.68 | 0 | 2448 |

해석:

- `C3 -> C4`는 사용자 영향 지표 관점에서 분명한 완화축이다.
- 다만 C4에도 Redis 예외 흔적이 남아, 이 시점 claim은 complete가 아니라 mitigation이다.

### Phase B. fail/control 재수집 (2026-03-13)

| Run | share-native-connection | `http_req_failed.rate` | `checks.rate` | req/s | health probe | nginx error |
|---|---|---:|---:|---:|---|---|
| fail | false | 0.0024898 | 0.9975160 | 651.62 | timeout | 499 다수(2350) |
| control | true | 0.0000000 | 1.0000000 | 808.62 | HTTP 200 | 499/5xx 없음 |

해석:

- 사용자 경로는 회복됐지만 control 내부 Redis 예외가 남아 complete 보류가 맞았다.
- 이 단계는 "회복 확인" 단계다.

### Phase C. 최신 브랜치 2x2 matrix closure (2026-03-14)

| CASE_ID | vt | redis share-native | `http_req_failed.rate` | `checks.rate` | health |
|---|---:|---:|---:|---:|---|
| after-vt-true-redis-true | true | true | 0 | 1 | HTTP/1.1 200 |
| after-vt-true-redis-false | true | false | 0 | 1 | HTTP/1.1 200 |
| after-vt-false-redis-true | false | true | 0.0000011747 | 0.9999986543 | HTTP/1.1 200 |
| after-vt-false-redis-false | false | false | 0 | 1 | HTTP/1.1 200 |

추가 검증:

- `api/worker/nginx app-key NO_MATCH`: 12/12
- 과거 장애 시그니처(`TaskRejectedException`, `AsyncExecutionInterceptor`, `RedisConnectionFailureException`, `Pool exhausted`)는 최신 matrix에서 재검출되지 않음
- 공용 `CacheEvictionListener` 경로 제거 + 도메인 분리 리스너 경로로 전환

## Final Verdict (2026-03-14)

- 판정: `complete`
- 문구 기준: `최신 브랜치 기준 Case4 완전해결`
- 제한: `모든 미래 배포 영구 0 오류 보장` 같은 과잉 단정은 금지

## Claim Guardrail

- 허용:
  - `2x2 matrix 재검증에서 사용자/내부 시그니처 동시 안정`
  - `2026-03-13 완화 -> 2026-03-14 complete closure`
- 금지:
  - `단일 변수 하나로 모든 원인 100% 증명`
  - `모든 환경에서 영구 무결점 보장`

## Portfolio Evidence Layout

```text
case4/
  before/
    c1~c4/ (raw archive)
    case4-phase-a-matrix-before-2026-03-13.svg
    case4-phase-b-fail-control-before-2026-03-13.svg
  after/
    case4-phase-c-matrix-after-2026-03-14.svg
    case4-phase-c-codepath-after-2026-03-14.svg
    web-dashboard-img/after-vt-*.png
  case4-evidence-manifest.md
```

## Web Dashboard Policy

- k6 웹 대시보드 캡처는 Case4에서 `보조증거`다.
- 따라서 before/after 강제 페어가 아니라 `after-only`로 유지한다.
- complete 판정 수치의 정본은 `실패율 요약표`, `체크 성공률`, `오류 로그 미검출`, `헬스체크 정상 응답`이다.

## 용어 빠른 해석 (서류 검토자용)

- 실패율 요약표: 부하 테스트에서 실패한 요청 비율을 보여주는 결과표
- 체크 성공률: 테스트 검증 항목이 얼마나 통과했는지 보여주는 비율
- 오류 로그 미검출: 과거 장애 때 보이던 핵심 오류 문구가 재등장하지 않음
- 헬스체크 정상 응답: 서버가 기본 상태 점검 요청에 정상(`HTTP 200`)으로 응답함

## Source of Truth

1. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/README.md`
2. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-logic-flow.md`
3. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-final-status-2026-03-14.md`
4. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-13/compare.md`
5. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-14/after/compare.md`
6. `./case4-evidence-manifest.md`

## 해석

Case4의 공개 설명은 "C3/C4 완화축 발견"에서 끝내지 않고, "latest-branch 2x2 재검증 + 코드 경로 소거 확인으로 complete 종료"까지 포함해야 문맥이 흔들리지 않는다.
