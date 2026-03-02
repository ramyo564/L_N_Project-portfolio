# CASE-4-A: C1~C4 재실행 가이드 (A PC/B PC 분리, ENV 방식)

## 0) 시작 기준

1. 지금 시작 상태는 `C1 = virtual=false, redis-shared=false`.
2. 총 4케이스를 순서대로 실행한다.
3. 설정 변경은 네가 하던 **ENV 방식만 사용**한다. (yml 수정/혼합 없음)

경로 기준(혼선 방지):

1. 이 문서의 절차는 **재실행용(raw 저장)** 기준이다. (`case4/evidence/matrix/...`)
2. 포트폴리오 본문에서 참조하는 **정식 경로는 `case4/before/c1~c4`** 이다.
3. 재실행 후에는 `evidence/matrix` 결과를 검토해서 `before/c1~c4`로 승격(정리)한다.

---

## 1) 케이스 정의 (고정)

| Case | Virtual Thread | Redis Shared |
|---|---|---|
| C1 | false | false |
| C2 | false | true |
| C3 | true | false |
| C4 | true | true |

---

## 1-A) 2026-02-27 실측 결과 (현재 저장본)

기준 파일:

- `case4/before/c1~c4/summary.txt`
- `case4/before/c1~c4/mvc-task-subtask-fixed-user-load-test-summary.json`
- `case4/before/c1~c4/root-cause.txt`

| Case | VT | Share | HTTP req/s | p95 (ms) | avg (ms) | `http_req_failed.rate` | `checks.rate` | `method_error_count` | `redis_conn_failure_count` | 메모 |
|---|---|---|---:|---:|---:|---:|---:|---:|---:|---|
| C1 | false | false | 932.33 | 269.39 | 130.67 | 0.0000 | 1.0000 | 0 | 0 | 가장 안정적 baseline |
| C2 | false | true  | 793.10 | 495.21 | 229.91 | 0.0003 | 0.9997 | 0 | 3044 | Redis 연결 실패 로그 존재(사용자 오류 낮음) |
| C3 | true  | false | 442.77 | 243.33 | 734.37 | 0.0106 | 0.9908 | 524 | 0 | 사용자 영향이 가장 큼(메서드 에러 다수) |
| C4 | true  | true  | 804.68 | 468.10 | 218.56 | 0.0000 | 1.0000 | 0 | 2448 | C3 대비 회복, Redis 연결 실패 로그는 잔존 |

해석 기준:

1. 사용자 영향은 `method_error_count`, `http_req_failed.rate`, `checks.rate`를 우선 본다.
2. 원인 단서는 `root-cause.txt` 예외 체인으로 본다.
3. `redis_conn_failure_count`는 "잠재 리스크"로 분류하고, 사용자 실패 지표와 분리해서 기술한다.

주의:

- `mvc-write-failure-summary.txt`의 "HTTP 요청 실패 100%" 문구는 k6 rate 집계 해석(성공/실패 방향) 혼동 가능성이 있어 본문 수치 근거로 사용하지 않는다.
- 본문에는 반드시 JSON 원본(`mvc-task-subtask-fixed-user-load-test-summary.json`)의 `http_req_failed.rate`를 사용한다.

---

## 2) PC 역할 (고정)

1. `A PC`: k6 실행, k6 결과 보관
2. `B PC`: Spring 서버, 서버 로그 추출

---

## 3) 케이스 1개 실행 절차 (C1/C2/C3/C4 공통)

아래를 케이스마다 반복.

### Step 1. (B PC) 케이스 설정 적용

네 방식으로 ENV 설정:

- `virtual = true/false`
- `redis shared = true/false`

설정 적용 후 spring 재기동.

### Step 2. (B PC) 실행 메타 기록 + 시작시각 저장

```bash
CASE_ID=C1                      # 케이스마다 C1/C2/C3/C4 변경
VT=false                        # 케이스 값으로 변경
SHARE=false                     # 케이스 값으로 변경

BASE=/tmp/case4-matrix
RUN_TS=$(date +%Y%m%d-%H%M%S)
RUN_DIR=$BASE/${CASE_ID}-${RUN_TS}
CONTAINER=upgrade_todo_stress-spring-1

mkdir -p "$RUN_DIR"

{
  echo "case_id=$CASE_ID"
  echo "started_at=$(date -Iseconds)"
  echo "virtual_thread=$VT"
  echo "redis_shared=$SHARE"
  echo "container=$CONTAINER"
} > "$RUN_DIR/config.txt"

date -Iseconds > "$RUN_DIR/start_ts.txt"
```

### Step 3. (A PC) k6 실행

네가 쓰는 기존 명령 그대로 실행.

### Step 4. (B PC) 케이스 종료 후 로그 추출

```bash
START_TS=$(cat "$RUN_DIR/start_ts.txt")
END_TS=$(date -Iseconds)

docker logs --since "$START_TS" --until "$END_TS" "$CONTAINER" 2>&1 \
| grep -aEi "event=method_error|RedisConnectionFailureException|PoolException|NoSuchElementException|RedisPipelineException|QueryTimeoutException|request timeout|status=0" \
> "$RUN_DIR/app-key.log"

if [ ! -s "$RUN_DIR/app-key.log" ]; then
  echo "NO_MATCH: no target error pattern in this run." > "$RUN_DIR/app-key.log"
fi

grep -aoE "RedisConnectionFailureException: [^\\\\]+|PoolException: [^\\\\]+|NoSuchElementException: [^\\\\]+|RedisPipelineException: [^\\\\]+|QueryTimeoutException: [^\\\\]+" \
"$RUN_DIR/app-key.log" | sort -u > "$RUN_DIR/root-cause.txt"

grep -aoE 'event=method_error[^"]+' "$RUN_DIR/app-key.log" \
| head -n 30 > "$RUN_DIR/method-error-top30.log"

{
  echo "ended_at=$END_TS"
  echo "method_error_count=$(grep -ac 'event=method_error' "$RUN_DIR/app-key.log" || true)"
  echo "status0_count=$(grep -ac 'status=0' "$RUN_DIR/app-key.log" || true)"
  echo "request_timeout_count=$(grep -aci 'request timeout' "$RUN_DIR/app-key.log" || true)"
  echo "redis_conn_failure_count=$(grep -ac 'RedisConnectionFailureException' "$RUN_DIR/app-key.log" || true)"
  echo "pool_exception_count=$(grep -ac 'PoolException' "$RUN_DIR/app-key.log" || true)"
  echo "borrow_timeout_count=$(grep -ac 'NoSuchElementException: Timeout waiting for idle object' "$RUN_DIR/app-key.log" || true)"
  echo "pipeline_exception_count=$(grep -ac 'RedisPipelineException' "$RUN_DIR/app-key.log" || true)"
  echo "query_timeout_count=$(grep -ac 'QueryTimeoutException' "$RUN_DIR/app-key.log" || true)"
} > "$RUN_DIR/summary.txt"
```

### Step 5. (A PC) k6 결과 보관

```bash
OUT_DIR=Z-PORTFOLIO-LOCAL/docs/upgrade_todo/Portfolio/case4/evidence/matrix/${CASE_ID}-${RUN_TS}
mkdir -p "$OUT_DIR"

cp upgrade_todo/k6/scenarios_2/results/mvc-task-subtask-fixed-user-load-test-summary.json "$OUT_DIR/"
cp upgrade_todo/k6/scenarios_2/results/mvc-write-failure-summary.txt "$OUT_DIR/" 2>/dev/null || true
```

> 참고: 본문 반영본은 최종적으로 `case4/before/c1~c4`에 정리한다.

### Step 6. (B PC -> A PC) 로그를 복붙으로 이동

`scp` 없이 복붙 방식:

```bash
# B PC에서 출력
echo "===== SUMMARY START ====="; cat "$RUN_DIR/summary.txt"; echo "===== SUMMARY END ====="
echo "===== ROOT START ====="; cat "$RUN_DIR/root-cause.txt"; echo "===== ROOT END ====="
echo "===== TOP30 START ====="; cat "$RUN_DIR/method-error-top30.log"; echo "===== TOP30 END ====="
```

```bash
# A PC에서 저장
cat > "$OUT_DIR/summary.txt" <<'EOF'
여기에 SUMMARY 내용 붙여넣기
EOF

cat > "$OUT_DIR/root-cause.txt" <<'EOF'
여기에 ROOT 내용 붙여넣기
EOF

cat > "$OUT_DIR/method-error-top30.log" <<'EOF'
여기에 TOP30 내용 붙여넣기
EOF
```

---

## 4) 케이스 종료 때마다 반드시 남길 파일

각 케이스 폴더(`evidence/matrix/Cx-...`)에 아래 5개 필수:

1. `config.txt` (B PC에서 생성)
2. `mvc-task-subtask-fixed-user-load-test-summary.json` (A PC k6 결과)
3. `summary.txt` (카운트 요약)
4. `root-cause.txt` (예외 체인 uniq)
5. `method-error-top30.log` (최대 30줄)

선택:

1. `mvc-write-failure-summary.txt`
2. `app-key.log` 전체본

정리 완료본(본문 참조 경로):

1. `case4/before/c1/*`
2. `case4/before/c2/*`
3. `case4/before/c3/*`
4. `case4/before/c4/*`

---

## 5) 실행 순서 (처음부터 다시)

1. C1 실행/기록 완료
2. C2 실행/기록 완료
3. C3 실행/기록 완료
4. C4 실행/기록 완료
5. 마지막에 4케이스 `summary.txt` + k6 json 비교해서 결론 작성

---

## 6) 주의사항

1. 케이스마다 `RUN_TS`를 새로 만들어 파일 덮어쓰기 금지
2. A PC/B PC 경로 섞지 않기
3. `docker logs`는 항상 `--since START_TS --until END_TS`로 해당 테스트 구간만 추출
