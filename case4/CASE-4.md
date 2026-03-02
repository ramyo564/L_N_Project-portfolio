# Case 4. VT + Redis Shared 설정 조합 매트릭스 (C1~C4)

> 기준일: 2026-02-27  
> 기준 데이터: `case4/before/c1~c4/*` + Grafana 캡처(`k6/postgres/redis/rmq`)

---

## 0) 최종 결론 한 줄

현재 데이터 기준에서 Case 4는 **`VT=true + share=false(C3)`에서 사용자 영향이 가장 크고, `share=true(C4)`에서 회복되는 설정 민감형 경합**으로 정리한다.

---

## 1) 증거 범위 (이번 문서에서 채택)

본문 필수:

1. `case4/before/c3/summary.txt`
2. `case4/before/c3/mvc-task-subtask-fixed-user-load-test-summary.json`
3. `case4/before/c3/root-cause.txt`
4. `case4/before/c3/method-error-top30.log`
5. `case4/before/c4/summary.txt`
6. `case4/before/c4/mvc-task-subtask-fixed-user-load-test-summary.json`
7. `case4/before/c4/root-cause.txt`
8. `case4/before/c3/c3-k6.png`, `c3-postgres.png`, `c3-redis.png`, `c3-rmq.png`
9. `case4/before/c4/c4-k6.png`, `c4-postgres.png`, `c4-redis.png`, `c4-rmq.png`

보조:

1. `case4/before/c1/*` (baseline)
2. `case4/before/c2/*` (중간 상태)
3. `case4/before/c*/c*-rmq-web.png` (참고용, 본문 필수 아님)

포트폴리오 UI 동기화 메모:

1. 카드/팝업에는 비교축이 명확한 `C3`, `C4` 대표 이미지를 우선 노출한다.
2. `C1`, `C2` 원본 증거는 본 문서와 `case4/before/c1~c2/*`에서 보조 근거로 유지한다.

---

## 2) C1~C4 결과 요약

| Case | VT | Share | HTTP req/s | p95 (ms) | avg (ms) | `http_req_failed.rate` | `checks.rate` | `method_error_count` | `redis_conn_failure_count` |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|
| C1 | false | false | 932.33 | 269.39 | 130.67 | 0.0000 | 1.0000 | 0 | 0 |
| C2 | false | true  | 793.10 | 495.21 | 229.91 | 0.0003 | 0.9997 | 0 | 3044 |
| C3 | true  | false | 442.77 | 243.33 | 734.37 | 0.0106 | 0.9908 | 524 | 0 |
| C4 | true  | true  | 804.68 | 468.10 | 218.56 | 0.0000 | 1.0000 | 0 | 2448 |

핵심 비교축:

1. `C3 -> C4`에서 `method_error_count`가 `524 -> 0`, `http_req_failed.rate`가 `1.06% -> 0%`로 회복
2. `C1`은 안정 baseline
3. `C2/C4`의 `RedisConnectionFailureException` 카운트는 잠재 리스크로 분류

---

## 3) 해석 규칙 (과장 방지)

1. 사용자 영향 평가는 `method_error_count`, `http_req_failed.rate`, `checks.rate`, `req/s`를 우선한다.
2. `p95` 단독으로는 결론을 내리지 않는다. (실패 구간/극단값 영향으로 왜곡 가능)
3. 예외 로그(`root-cause.txt`)는 원인 "후보" 신호로 쓰고, 사용자 영향 지표와 함께 제시한다.
4. `mvc-write-failure-summary.txt`의 "HTTP 요청 실패 100%" 문구는 본문 수치 근거로 사용하지 않는다.

---

## 4) 포트폴리오 본문용 서술 (복붙용)

```text
In the C1~C4 configuration matrix test (2026-02-27), the highest user impact was observed in C3 (VT=true, share=false): method_error_count=524, http_req_failed.rate=1.06%, and throughput drop to 442.77 req/s.
Under the same virtual-thread condition, C4 (share=true) recovered user-facing stability (method_error_count=0, http_req_failed.rate=0%, checks.rate=1.0) with throughput up to 804.68 req/s.
Based on this on/off contrast, Case 4 is concluded as configuration-sensitive contention under high load, and the final mitigation axis is share=false -> share=true within VT=true.
```

---

## 5) 이미지 사용 규칙

1. 본문 필수 이미지는 `c*-k6`, `c*-postgres`, `c*-redis`, `c*-rmq` 4종으로 고정한다.
2. `c*-rmq-web`는 부록/참고로만 유지한다.
3. `c2-redis.png` 아래에는 시간대 주석을 붙인다.  
   `주석: Grafana/브라우저 시간대(TZ) 차이로 다른 패널과 시각 표기가 다르게 보일 수 있음.`

---

## 6) 최종 상태

- [x] Case 4 본문을 `C3 vs C4` 비교축으로 작성
- [x] `c1/c2`를 baseline/보조 근거로 배치
- [x] `rmq-web` 이미지를 본문 필수 목록에서 제외
- [x] `c2-redis` 시간대(TZ) 주석 규칙 반영
