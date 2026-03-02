# Case 4 Evidence Capture Guide (Fixed Baseline)

## Required artifacts

- `fail/config.txt`
- `fail/k6-summary.txt`
- `fail/app-key.log`
- `fail/root-cause.txt`
- `control/config.txt`
- `control/k6-summary.txt`
- `control/app-key.log`
- `shared-false-rationale.md`

## Where to run commands

- `docker logs ...` and `grep ... app-full.log` commands must run on the server where the Spring container is running.
- Use any server-local temp path for capture, for example:
  - `SERVER_CASE4_DIR=/tmp/case4-control`
- The portfolio docs path (`Z-PORTFOLIO-LOCAL/.../case4/evidence/...`) is for final storage only.
- If server and local docs machine are different, copy artifacts with `scp` after capture.

## Capture commands

Fail run (`VT=true`, `share=false`):

```bash
mkdir -p case4/evidence/fail case4/evidence/control

docker logs -f upgrade_todo_stress-spring-1 2>&1 \
  | tee case4/evidence/fail/app-full.log \
  | grep --line-buffered -Ei "event=method_error.*AuthController.*method=login|RedisConnectionFailureException|PoolException|NoSuchElementException|request timeout|status=0"
```

```bash
grep -aEn "event=method_error.*AuthController.*method=login|RedisConnectionFailureException|PoolException|NoSuchElementException|request timeout|status=0" \
  case4/evidence/fail/app-full.log > case4/evidence/fail/app-key.log
```

```bash
grep -aoE "RedisConnectionFailureException: [^\\\\]+|PoolException: [^\\\\]+|NoSuchElementException: [^\\\\]+" \
  case4/evidence/fail/app-key.log | sort -u > case4/evidence/fail/root-cause.txt
```

Control run (`VT=true`, `share=true`):

```bash
docker logs -f upgrade_todo_stress-spring-1 2>&1 \
  | tee case4/evidence/control/app-full.log \
  | grep --line-buffered -Ei "event=method_error.*AuthController.*method=login|RedisConnectionFailureException|PoolException|NoSuchElementException|request timeout|status=0"
```

```bash
grep -aEn "event=method_error.*AuthController.*method=login|RedisConnectionFailureException|PoolException|NoSuchElementException|request timeout|status=0" \
  case4/evidence/control/app-full.log > case4/evidence/control/app-key.log

if [ ! -s case4/evidence/control/app-key.log ]; then
  echo "NO_MATCH: same Redis pool-timeout pattern not detected in control run." > case4/evidence/control/app-key.log
fi
```

## Decision rule

- Fail and control must use the same k6 workload and duration.
- Root cause is confirmed by on/off contrast:
  - Fail: login method_error + Redis pool-timeout chain + timeout/status=0.
  - Control: same pattern disappears or is significantly reduced.

## Do not mix with old run pattern

Do not use these patterns for Case 4 final conclusion:

- `RedisPipelineException`
- `QueryTimeoutException`
- `durationMs=299xxx`
