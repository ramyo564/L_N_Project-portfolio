# Case 4. C3/C4 완화축 식별에서 2x2 재검증 complete closure까지

> 기준일: 2026-03-14
> canonical status: `complete (latest-branch verification complete)`
> timeline scope: `2026-03-13` + `2026-03-14`

## 요약

Case 4는 단순한 설정 변경이 아닌, 3단계의 체계적인 검증을 통해 시스템 무결성을 입증했다.

1. **[단계 1] 병목 지점 탐색:** 설정 조합 비교를 통해 성능 저하를 유발하는 핵심 설정(완화축)을 식별했다.
2. **[단계 2] 회복성 확인:** 사용자 지표 회복을 확인하고, 내부 예외 상황과의 상관관계를 분석하여 리스크를 분리했다.
3. **[단계 3] 최종 신뢰성 입증:** '가상 스레드 vs 플랫폼 스레드' 등 모든 경우의 수를 조합한 최종 테스트에서 100% 안정을 확인했다.

## 검증 타임라인 (Timeline)

### 1단계. 설정 조합별 병목 지점 탐색 (2026-03-13)

| 테스트 케이스 | 가상스레드 | 설정최적화 | 실패율 (`http_req_failed`) | 초당처리량 (req/s) | 에러 건수 |
|---|---|---|---:|---:|---:|
| 기존 설정 (C3) | true | false | 0.0106 | 442.77 | 524 |
| 최적화 설정 (C4) | true | true | 0.0000 | 804.68 | 0 |

해석:
- 최적화 설정 적용 시 사용자 체감 에러가 즉시 사라짐을 확인했다.
- 다만 내부 로그상 미세한 예외 흔적이 남아, 완벽한 종료를 위해 추가 검증을 진행했다.

### 2단계. 사용자 지표 회복 및 잔존 리스크 분석 (2026-03-13)

| 실행 구분 | 설정 적용 여부 | 실패율 (`http_req_failed`) | 초당처리량 (req/s) | 상태 점검 (Health) |
|---|---|---:|---:|---|
| 개선 전 (fail) | false | 0.0024 | 651.62 | 시간 초과 (timeout) |
| 개선 후 (control) | true | 0.0000 | 808.62 | 정상 (HTTP 200) |

해석:
- 사용자 경로의 가시적인 회복은 확인했으나, 시스템 내부의 안정성(Internal Stability)을 확정 짓기 위해 최종 매트릭스 테스트를 설계했다.

### 3단계. 2x2 매트릭스 기반 최종 안정성 입증 (2026-03-14)

| 최종 검증 조합 | 가상스레드 | 레디스 연결 최적화 | 실패율 | 검증 통과율 | 서버 상태 |
|---|---:|---:|---:|---:|---|
| 조합 A | 사용 | 적용 | 0 | 100% | 정상 (200) |
| 조합 B | 사용 | 미적용 | 0 | 100% | 정상 (200) |
| 조합 C | 미사용 | 적용 | 0 | 100% | 정상 (200) |
| 조합 D | 미사용 | 미적용 | 0 | 100% | 정상 (200) |

추가 검증 결과:
- 과거 발생했던 핵심 장애 시그니처(`TaskRejectedException`, `Pool exhausted` 등)가 모든 조합에서 재검출되지 않음.
- 인프라 설정과 무관하게 애플리케이션 레벨에서의 완전한 해결을 입증하여 Case 4를 최종 종료함.

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

## 🔍 집요한 증거 수집 및 검증 체계 (Evidence Management)

본 케이스의 결론은 단순한 추측이나 단발성 성공이 아닌, 다음과 같은 철저한 원천 데이터 관리를 기반으로 도출되었습니다.

1. **매트릭스 교차 검증:** 신규 기술(Virtual Threads)과 인프라 설정 조합에 따른 2x2 부하 테스트 리포트를 생성하여 변수를 완벽히 통제했습니다.
2. **로그 시그니처 분석:** 과거 장애의 핵심 시그니처(`TaskRejectedException`, `RedisConnectionFailure`)가 최신 브랜치에서 완전히 소거되었음을 로그 단위로 확인했습니다.
3. **지표 정합성 매핑:** k6 실측 수치와 Grafana 메트릭, Nginx 에러 로그의 타임스탬프를 상호 대조하여 데이터의 무결성을 확보했습니다.
4. **원천 증거 이력 관리:** 모든 테스트 결과물은 포트폴리오 화면과 1:1로 매핑된 내부 증거 저장소(`Z-manage_local_docs`)를 통해 체계적으로 추적/관리되고 있습니다.

## Source of Truth

1. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/README.md`
2. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-logic-flow.md`
3. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4/case4-final-status-2026-03-14.md`
4. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-13/compare.md`
5. `../../Z-manage_local_docs/projects/life-navigation/evidence/assets/case4-root-cause-2026-03-14/after/compare.md`
6. `./case4-evidence-manifest.md`

## 해석

Case4의 공개 설명은 "C3/C4 완화축 발견"에서 끝내지 않고, "latest-branch 2x2 재검증 + 코드 경로 소거 확인으로 complete 종료"까지 포함해야 문맥이 흔들리지 않는다.
