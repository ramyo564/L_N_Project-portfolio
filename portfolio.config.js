/**
 * Project Portfolio Configuration (DTO)
 * 오직 프로젝트 고유 데이터(수치, 텍스트, 증거 이미지 경로)만 선언적으로 정의하는 단일 진실 공급원(SSOT)입니다.
 * UI 렌더링 로직이나 CSS와 완전히 분리되어 있어, 수정과 유지보수가 극도로 편리합니다.
 */
import { portfolioCases } from './js/data/portfolio-cases.js';

export const portfolioConfig = {
    brand: 'YOHAN · BACKEND ARCHITECT',
    navLinks: [
        { label: 'Case Studies', href: '#cases' },
        { label: 'Architecture Docs ↗', href: 'https://ramyo564.github.io/L_N_Project/', target: '_blank' },
        { label: 'GitHub ↗', href: 'https://github.com/ramyo564/L_N_Project', target: '_blank' },
        { label: 'Contact', href: 'mailto:yohan032yohan@gmail.com' }
    ],
    hero: {
        kicker: 'Notion Portfolio Verification Funnel',
        headline: '1,000 VU Peak Load.<br>0.00% Failed Rate.<br>Zero System Loss.',
        description: '노션 포트폴리오의 부하 테스트 및 시스템 최적화 수치를 기계적 실측 증거로 검증합니다. 가상 스레드 환경에서 RabbitMQ 비동기 분리, JPA 영속성 튜닝, 권한 게이트 단일화를 통해 고부하 병목을 구조적으로 해결했습니다.',
        killerMetrics: [
            { number: '0.00%', label: 'Failed Rate (1,000 VU)', desc: '725,382건 무손실 완결' },
            { number: '+350%', label: 'Write RPS Boost', desc: '373 → 916 RPS 처리량 확장' },
            { number: '15x', label: 'Latency Cut', desc: 'Write p95 3.4s → 126ms (-96%)' },
            { number: '3 → 1', label: 'Auth Gate Queries', desc: 'AOP 기반 단일 권한 검증' }
        ]
    },
    sectionIntro: {
        tag: 'Evidence Showcase',
        headline: '핵심 트러블슈팅 및 실측 증거',
        hint: '이미지를 클릭하면 고해상도 원본으로 확대 검증할 수 있습니다.'
    },
    cases: portfolioCases
};
