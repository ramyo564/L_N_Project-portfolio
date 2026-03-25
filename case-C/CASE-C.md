# Case C. 단일 권한 게이트 구축 및 소셜 로그인 통합을 통한 인증 아키텍처 최적화

> 기준일: 2025-11-20
> 비교축: `Before (Legacy Auth / Tight Coupling) -> After (Unified Gate / Decoupled OAuth2)`

## 요약 (REVIEWER SUMMARY)

- **불필요하게 반복되던 권한 검증 로직을 JWT Claims와 AOP 기반의 단일 게이트로 통합하여 쿼리 횟수를 3회에서 1회로 줄였습니다.**
- **DI(의존성 주입) 및 DIP(의존성 역전 원칙)를 적용해 Google, Kakao, Naver 등 다중 소셜 로그인 구조를 추상화하여 도메인 결합도를 낮췄습니다.**
- **외부 벤더사의 변경이나 추가에도 핵심 비즈니스 로직이 영향받지 않는 유연하고 확장성 높은 인증 아키텍처를 확립했습니다.**

## TECH DETAIL
- **Security & Auth**: Spring Security, JWT (Claims extraction), Redis (Session 관리)
- **Architecture**: AOP (Advice-based access control), DI/DIP (Dependency Inversion), Interface-based Abstraction
- **Standards**: OAuth2.0, OpenID Connect (OIDC)

## 문제 (PROBLEM)
서비스의 진입점인 인증/권한 로직에서 불필요한 DB 조회가 반복되고 있었으며, 다양한 소셜 로그인(Google, Kakao, Naver)이 추가되면서 도메인이 기술적인 세부 사항에 강하게 결합될 위험이 있었습니다.

1. **권한 검증의 N+1 병목**: 모든 API 요청마다 `JwtAuthenticationFilter`에서 유저 정보를 조회하고, 각 컨트롤러 핸들러에서 프로젝트 소유권 및 활성 상태를 개별적으로 검증하면서 요청당 평균 3회의 중복 쿼리가 발생했습니다. 이는 고부하 상황에서 DB 부하를 가중시키는 주요 원인이었습니다.
2. **소셜 로그인 결합도 상승**: 벤더사(Google, Kakao, Naver)마다 제각각인 응답 규격과 인증 흐름이 도메인 서비스 로직에 직접 노출되어 있었습니다. 새로운 로그인 수단이 추가될 때마다 기존 코드를 대량으로 수정해야 하는 확장성 문제가 존재했습니다.

## 해결 (ACTION)
"인증은 토큰 정보로, 권한은 선행 게이트에서"라는 원칙을 수립하고, 기술적 세부 사항을 추상화 뒤로 숨기는 설계를 적용했습니다.

1. **JWT Claims 기반 단일 권한 게이트 (`AOP`)**:
   - `JwtProvider`를 고도화하여 토큰의 Claims에서 `userId`와 `email`을 즉시 추출, DB 호출 없이 `Principal` 객체를 생성하도록 개선했습니다.
   - `@CheckProjectAccess` 커스텀 어노테이션과 AOP Aspect를 구축하여, 컨트롤러 진입 전 공통 로직에서 권한을 사전 검증함으로써 비즈니스 로직과 권한 검증 책임을 엄격히 분리했습니다.
2. **OAuth2 채널 추상화 (`DI/DIP`)**:
   - `OAuth2UserInfo` 인터페이스를 정의하여 각 벤더사의 응답 규격을 표준화된 포맷으로 변환하도록 설계했습니다.
   - 전략 패턴(Strategy Pattern)을 적용하여 런타임에 적절한 인증 공급자를 주입받는 구조로 변경함으로써, 도메인 로직의 수정 없이 설정만으로 신규 로그인 채널을 확장할 수 있는 유연성을 확보했습니다.

## 결과 (IMPACT)
대표 단일 요청의 권한 검증 게이트를 3단계에서 1단계로 축소하여 고부하 환경에서도 지연 없는 응답을 보장하고, 확장성 높은 다중 소셜 로그인 아키텍처를 완성했습니다.

- **인증 지연 최소화**: JWT Claims 활용으로 인증 단계의 사용자 조회 쿼리를 제거하여 시스템 전체의 읽기 성능을 최적화했습니다.
- **아키텍처 유연성 (OCP 준수)**: 소셜 로그인 연동 책임이 완전히 격리되어, 벤더사 API 명세 변경 시에도 비즈니스 로직을 보호할 수 있는 방어벽을 구축했습니다.
- **코드 무결성**: AOP 기반의 중앙 집중식 권한 관리를 통해 권한 누락으로 인한 보안 취약점 발생 가능성을 원천 차단했습니다.

## 핵심 파일
- `Security Gateway`: `JwtAuthenticationFilter`, `JwtProvider` (Claims parsing)
- `Auth Gate`: `ProjectAccessAspect` (@CheckProjectAccess handling)
- `OAuth2 Logic`: `OAuth2UserInfoFactory`, `GoogleUserInfo`, `KakaoUserInfo`, `NaverUserInfo`
- `Abstraction`: `SocialLoginService` interface
