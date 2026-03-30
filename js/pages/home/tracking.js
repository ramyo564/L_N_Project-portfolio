import {
    createTrackSelectContent,
    updateMaxScrollPercent as updateAnalyticsMaxScrollPercent,
    stopVisibleTimer as stopAnalyticsVisibleTimer,
    startVisibleTimer as startAnalyticsVisibleTimer,
    setupAnalyticsLifecycle as setupSharedAnalyticsLifecycle
} from '../../shared/analytics.js';

export function createHomeTracking({ byId } = {}) {
    const analyticsSession = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        pageType: 'portfolio',
        pageStartedAt: Date.now(),
        visibleStartedAt: document.visibilityState === 'hidden' ? 0 : Date.now(),
        visibleDurationMs: 0,
        maxScrollPercent: 0,
        currentSectionId: '',
        currentSectionName: '',
        currentSectionEnteredAt: 0,
        uniqueCaseViews: new Set(),
        k6OverviewModalOpenedAt: 0,
        extraEvidenceModalOpenedAt: 0,
        mermaidModalOpenedAt: 0,
        ended: false
    };

    const trackSelectContent = createTrackSelectContent({
        session: analyticsSession,
        getPageType: () => analyticsSession.pageType
    });

    const updateMaxScrollPercent = () => updateAnalyticsMaxScrollPercent(analyticsSession);
    const stopVisibleTimer = (timestamp = Date.now()) => stopAnalyticsVisibleTimer(analyticsSession, timestamp);
    const startVisibleTimer = (timestamp = Date.now()) => startAnalyticsVisibleTimer(analyticsSession, timestamp);

    function trackCurrentSectionDwell(interactionAction) {
        if (!analyticsSession.currentSectionId || !analyticsSession.currentSectionEnteredAt) {
            return;
        }
        const durationMs = Math.max(0, Date.now() - analyticsSession.currentSectionEnteredAt);
        if (durationMs < 200) {
            return;
        }
        trackSelectContent({
            contentType: 'section_dwell',
            itemId: analyticsSession.currentSectionId,
            itemName: analyticsSession.currentSectionName || analyticsSession.currentSectionId,
            sectionName: 'scroll_spy',
            interactionAction: interactionAction || 'switch',
            elementType: 'section',
            elementLabel: analyticsSession.currentSectionName || analyticsSession.currentSectionId,
            duration_ms: durationMs,
            value: Math.round(durationMs / 1000)
        });
    }

    function endAnalyticsSession(reason = 'pagehide') {
        if (analyticsSession.ended) {
            return;
        }
        analyticsSession.ended = true;

        updateMaxScrollPercent();
        stopVisibleTimer();
        trackCurrentSectionDwell('session_end');
        analyticsSession.currentSectionEnteredAt = 0;

        const totalDurationMs = Math.max(0, Date.now() - analyticsSession.pageStartedAt);
        const visibleDurationMs = Math.min(totalDurationMs, analyticsSession.visibleDurationMs);
        const hiddenDurationMs = Math.max(0, totalDurationMs - visibleDurationMs);

        trackSelectContent({
            contentType: 'page_engagement',
            itemId: 'portfolio_page',
            itemName: document.title || 'Life Navigation Portfolio',
            sectionName: 'lifecycle',
            interactionAction: 'end',
            elementType: 'page',
            elementLabel: 'PAGE_END',
            sourceEvent: 'lifecycle',
            duration_ms: totalDurationMs,
            engagement_time_msec: visibleDurationMs,
            hidden_duration_ms: hiddenDurationMs,
            max_scroll_percent: analyticsSession.maxScrollPercent,
            unique_case_views: analyticsSession.uniqueCaseViews.size,
            end_reason: reason,
            value: Math.round(visibleDurationMs / 1000)
        });
    }

    function setupAnalyticsLifecycle() {
        setupSharedAnalyticsLifecycle({
            session: analyticsSession,
            updateMaxScrollPercent,
            startVisibleTimer,
            stopVisibleTimer,
            onStart: () => {
                trackSelectContent({
                    contentType: 'page_engagement',
                    itemId: 'portfolio_page',
                    itemName: document.title || 'Life Navigation Portfolio',
                    sectionName: 'lifecycle',
                    interactionAction: 'start',
                    elementType: 'page',
                    elementLabel: 'PAGE_START',
                    sourceEvent: 'lifecycle'
                });
            },
            onHidden: () => {
                trackSelectContent({
                    contentType: 'page_visibility',
                    itemId: 'portfolio_page',
                    itemName: document.title || 'Life Navigation Portfolio',
                    sectionName: 'lifecycle',
                    interactionAction: 'hidden',
                    elementType: 'page',
                    elementLabel: 'PAGE_HIDDEN',
                    sourceEvent: 'lifecycle'
                });
            },
            onVisible: () => {
                trackSelectContent({
                    contentType: 'page_visibility',
                    itemId: 'portfolio_page',
                    itemName: document.title || 'Life Navigation Portfolio',
                    sectionName: 'lifecycle',
                    interactionAction: 'visible',
                    elementType: 'page',
                    elementLabel: 'PAGE_VISIBLE',
                    sourceEvent: 'lifecycle'
                });
            },
            onEnd: endAnalyticsSession
        });
    }

    function setupScrollSpy() {
        const nav = byId?.('header-nav');
        if (!nav) {
            return;
        }

        const links = Array.from(nav.querySelectorAll('.nav-item, .nav-sub-item'));
        if (links.length === 0) {
            return;
        }

        const targetMap = new Map();
        links.forEach((link) => {
            const href = String(link.getAttribute('href') || '');
            if (!href.startsWith('#') || href.length < 2) {
                return;
            }

            const targetId = href.slice(1);
            const targetElement = byId?.(targetId);
            if (!targetElement) {
                return;
            }

            if (!targetMap.has(targetId)) {
                targetMap.set(targetId, {
                    element: targetElement,
                    links: []
                });
            }
            targetMap.get(targetId).links.push(link);
        });

        if (targetMap.size === 0) {
            return;
        }

        const caseWrap = nav.querySelector('.nav-item-wrap.has-submenu');
        const caseParent = caseWrap?.querySelector('.nav-parent') ?? null;
        let sortedTargets = [];
        let currentActiveId = '';
        let rafToken = 0;
        const isTargetVisible = (element) => {
            if (!(element instanceof HTMLElement) || element.hidden) {
                return false;
            }
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden';
        };

        const clearActive = () => {
            links.forEach((link) => link.classList.remove('is-active'));
            if (caseWrap) {
                caseWrap.classList.remove('is-active-group');
            }
        };

        const activateTarget = (targetId) => {
            if (!targetId || currentActiveId === targetId) {
                return;
            }

            if (analyticsSession.currentSectionId && analyticsSession.currentSectionId !== targetId) {
                trackCurrentSectionDwell('switch');
            }

            currentActiveId = targetId;
            clearActive();

            const matched = targetMap.get(targetId);
            if (!matched) {
                return;
            }

            matched.links.forEach((link) => link.classList.add('is-active'));
            const hasSubItem = matched.links.some((link) => link.classList.contains('nav-sub-item'));
            if (hasSubItem && caseWrap && caseParent) {
                caseWrap.classList.add('is-active-group');
                caseParent.classList.add('is-active');
            }

            const targetElement = matched.element;
            const isCaseCard = targetElement.classList.contains('service-card') || targetId.startsWith('upgrade-todo-case-');
            const itemName =
                targetElement.querySelector('.card-title')?.textContent?.trim() ||
                targetElement.querySelector('.section-title')?.textContent?.trim() ||
                targetElement.querySelector('.panel-title')?.textContent?.trim() ||
                targetId;

            analyticsSession.currentSectionId = targetId;
            analyticsSession.currentSectionName = itemName;
            analyticsSession.currentSectionEnteredAt = Date.now();
            if (isCaseCard) {
                analyticsSession.uniqueCaseViews.add(targetId);
            }

            trackSelectContent({
                contentType: 'section_view',
                itemId: targetId,
                itemName,
                sectionName: 'scroll_spy',
                interactionAction: 'view',
                elementType: isCaseCard ? 'case_card' : 'section',
                elementLabel: itemName
            });
        };

        const rebuildTargetOrder = () => {
            sortedTargets = Array.from(targetMap.entries())
                .filter(([, payload]) => isTargetVisible(payload.element))
                .map(([targetId, payload]) => ({
                    targetId,
                    top: payload.element.getBoundingClientRect().top + window.scrollY
                }))
                .sort((left, right) => left.top - right.top);
        };

        const applyByScrollPosition = () => {
            if (sortedTargets.length === 0) {
                clearActive();
                currentActiveId = '';
                return;
            }

            const headerHeight = document.querySelector('.status-bar')?.offsetHeight ?? 0;
            const baseline = window.scrollY + headerHeight + 28;
            let activeId = sortedTargets[0].targetId;

            for (let index = 0; index < sortedTargets.length; index += 1) {
                if (baseline >= sortedTargets[index].top) {
                    activeId = sortedTargets[index].targetId;
                } else {
                    break;
                }
            }

            activateTarget(activeId);
        };

        const scheduleUpdate = () => {
            if (rafToken !== 0) {
                return;
            }
            rafToken = window.requestAnimationFrame(() => {
                rafToken = 0;
                applyByScrollPosition();
            });
        };

        rebuildTargetOrder();
        applyByScrollPosition();

        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', () => {
            rebuildTargetOrder();
            scheduleUpdate();
        });
        window.addEventListener('hashchange', scheduleUpdate);

        // Mermaid 렌더 완료 후 레이아웃 높이가 변할 수 있어 보정합니다.
        window.setTimeout(() => {
            rebuildTargetOrder();
            scheduleUpdate();
        }, 160);
        window.setTimeout(() => {
            rebuildTargetOrder();
            scheduleUpdate();
        }, 720);
    }

    return {
        analyticsSession,
        trackSelectContent,
        setupAnalyticsLifecycle,
        setupScrollSpy
    };
}
