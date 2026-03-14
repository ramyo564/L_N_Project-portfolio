# Case 1. UUIDv7 Persistable + Outbox 비동기 분리

> 기준일: 2026-03-13
> 비교축: `3c17e0bf^ -> 3c17e0bf`

## 요약

Case 1은 회원가입 처리에서 저장 책임과 후속 메시징 책임을 분리한 사례다.
사전 UUID 할당 엔티티가 `merge(SELECT+INSERT)` 경로로 들어가던 문제를
Persistable `isNew()`와 Outbox 비동기 분리로 정리했다.

핵심 결과는 다음 두 가지다.

1. 회원가입 응답이 `200`에서 `202 Accepted + X-User-Id` 흐름으로 바뀌었다.
2. 저장 경로가 `merge(SELECT+INSERT)` 중심에서 INSERT 중심 흐름으로 정리되었다.

## 문제

1. 사전 UUID 할당 엔티티가 merge 경로로 진입해 불필요한 SELECT와 INSERT가 함께 발생했다.
2. Auth/User 생성과 후속 처리 책임이 한 요청 흐름에 묶여 응답성과 복구 경계가 불명확했다.

## 해결

1. `AuthUserEntity`, `UserEntity`에 Persistable `isNew()`를 적용해 INSERT 중심 저장 경로로 전환했다.
2. 회원가입 후속 처리를 Outbox 테이블 저장 + 비동기 발행으로 분리했다.
3. 이벤트 처리 단위를 분리해 후속 실패가 핵심 요청 응답에 직접 전파되지 않게 정리했다.

## 결과

- 회원가입 응답 `200 -> 202`
- After 응답에서 `X-User-Id` 헤더 확인
- Hibernate SQL에서 `merge(SELECT+INSERT)` 제거
- Outbox 테이블과 RabbitMQ 큐를 통해 후속 처리 경로 분리 확인

## 사용한 증거

1. 회원가입 응답 캡처
2. Hibernate SQL before/after 캡처
3. Outbox 테이블 before/after 캡처
4. RabbitMQ Queue after 캡처

## 핵심 파일

### Before

- `before/case1-signup-response-before.png`
- `before/case1-hibernate-before.png`
- `before/case1-outbox-table-before.png`

### After

- `after/case1-signup-response-after.png`
- `after/case1-hibernate-after.png`
- `after/case1-outbox-table-after.png`
- `after/case1-rabbitmq-queue-after-auth.png`
- `after/case1-rabbitmq-queue-after-user.png`

## 해석

Case 1의 공개 claim은 성능 수치보다 저장/응답 계약의 변화에 있다.
즉, `회원가입 응답 200 -> 202`, `X-User-Id`, `merge 경로 제거`, `Outbox 분리`까지가
이 케이스에서 외부에 설명하는 핵심이다.
