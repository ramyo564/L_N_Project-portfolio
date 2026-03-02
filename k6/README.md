# K6 Test Environment README

`UPGRADE_TODO_PROBLEM_SOLVING_OVERVIEW` 팝업에서 참조하는 k6 테스트 설명 문서입니다.

## 1) Test Profile
- `RAMPING_PROFILE`: `default`
- `RAMPING_STAGES`: `2m@100, 3m@200, 5m@300, 10m@400, 5m@500, 5m@300, 2m@0`
- `MAX_VU`: `500`
- `TOTAL_DURATION`: 약 `32분`

## 2) Before / Current Evidence
- 이미지 경로: `L_N_Project-portfolio/k6-500-result`
- 쓰기 비교:
  - `write_500-before.png`
  - `write_500-current.png`
- 읽기 비교:
  - `read_500-before.png`
  - `read_500-current.png`

## 3) HW / Runtime Baseline
- CPU: `AMD Ryzen 7 5800U (8C/16T)`
- RAM: `32GB`
- OS: `Ubuntu 22.04 LTS`
- Storage: `NVMe SSD (PCIe 3.0)`

## 4) Script Map (Source)
실제 구동 스크립트는 아래 경로 기준으로 분석했습니다.

- Write:
  - `/home/yohan/Git-U/upgrade_todo/k6/scenarios_2/test/smoke_test/mvc-write-task-subtask-fixed-user-load-test.js`
- Read:
  - `/home/yohan/Git-U/upgrade_todo/k6/scenarios_2/test/smoke_test/mvc-read-fixed-user-load-test.js`
- 공통 설정:
  - `/home/yohan/Git-U/upgrade_todo/k6/scenarios_2/test/utils/load-test-config.js`
  - `/home/yohan/Git-U/upgrade_todo/k6/scenarios_2/test/utils/auth.js`
  - `/home/yohan/Git-U/upgrade_todo/k6/scenarios_2/test/utils/test-utils.js`
  - `/home/yohan/Git-U/upgrade_todo/k6/scenarios_2/test/utils/test-data.js`
  - `/home/yohan/Git-U/upgrade_todo/k6/scenarios_2/test/utils/warmup.js`

## 5) Scenario Logic
### Write (`mvc-write-task-subtask-fixed-user-load-test.js`)
1. Setup: `TOTAL_USERS`만큼 사용자 선등록
2. Iteration: 로그인 -> Project 생성 -> Task 생성 -> SubTask 생성
3. Cleanup: `SHOULD_DELETE_PROJECT=true`일 때 Project 삭제(하위 Task/SubTask cascade 삭제)

기본 생성량(1 iteration):
- Project `1`
- Task `2` (`TASKS_PER_ITERATION=2`)
- SubTask `6` (`SUBTASKS_PER_TASK=3`, Task 2개)
- 합계 생성 시도 row: `9`

### Read (`mvc-read-fixed-user-load-test.js`)
1. Setup: 사용자 등록 -> 사용자별 Project/Task/SubTask 생성 -> 캐시 웜업
2. Iteration: Project list/detail, Task list/detail, SubTask list 조회(읽기 전용)

기본 Setup 생성량(1 user):
- Project `1`
- Task `3`
- SubTask `9`
- 합계: `13`

## 6) DB Row Estimation (VU 500 기준, 대략)
### Write
- Setup 사용자: `TOTAL_USERS=1000`
- Iteration당 생성 시도: `9 rows`
- `current write RPS ~916` 가정, 요청 `6개/iteration` 기준:
  - iteration/s ~ `916 / 6 ≈ 153`
  - 32분 전체 iteration ~ `153 * 1920 ≈ 294,000`
  - 생성 시도 row ~ `294,000 * 9 ≈ 2,646,000`
- 단, `SHOULD_DELETE_PROJECT=true`로 Project/Task/SubTask는 최종 잔존이 거의 없음

### Read
- Setup에서 `1000 users * 13 rows = 13,000 rows` (project/task/subtask)
- 런타임 루프는 조회 전용이라 추가 생성 row는 거의 없음

## 7) Notes
- 위 row 수치는 k6 스크립트 구조 기준의 근사치입니다.
