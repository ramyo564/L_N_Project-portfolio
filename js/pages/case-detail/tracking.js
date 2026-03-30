import {
    createTrackSelectContent,
    updateMaxScrollPercent as updateAnalyticsMaxScrollPercent,
    stopVisibleTimer as stopAnalyticsVisibleTimer,
    startVisibleTimer as startAnalyticsVisibleTimer,
    setupAnalyticsLifecycle as setupSharedAnalyticsLifecycle
} from '../../shared/analytics.js';

export function createCaseDetailTracking() {
    const analyticsSession = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        pageStartedAt: Date.now(),
        visibleStartedAt: document.visibilityState === 'hidden' ? 0 : Date.now(),
        visibleDurationMs: 0,
        maxScrollPercent: 0,
        ended: false,
        pageType: 'case_list',
        caseNumber: null,
        caseTitle: 'Case Review'
    };

    const trackSelectContent = createTrackSelectContent({
        session: analyticsSession,
        getPageType: () => analyticsSession.pageType
    });
    const updateMaxScrollPercent = () => updateAnalyticsMaxScrollPercent(analyticsSession);
    const stopVisibleTimer = (timestamp = Date.now()) => stopAnalyticsVisibleTimer(analyticsSession, timestamp);
    const startVisibleTimer = (timestamp = Date.now()) => startAnalyticsVisibleTimer(analyticsSession, timestamp);

    function getCurrentItemId() {
        if (analyticsSession.pageType === 'case_detail' && analyticsSession.caseNumber) {
            return `case_${analyticsSession.caseNumber}`;
        }
        return 'case_review_list';
    }

    function getCurrentItemName() {
        if (analyticsSession.pageType === 'case_detail') {
            return analyticsSession.caseTitle || 'Case Review';
        }
        return 'Case Brief List';
    }

    function endAnalyticsSession(reason = 'pagehide') {
        if (analyticsSession.ended) {
            return;
        }
        analyticsSession.ended = true;

        updateMaxScrollPercent();
        stopVisibleTimer();

        const totalDurationMs = Math.max(0, Date.now() - analyticsSession.pageStartedAt);
        const visibleDurationMs = Math.min(totalDurationMs, analyticsSession.visibleDurationMs);
        const hiddenDurationMs = Math.max(0, totalDurationMs - visibleDurationMs);

        trackSelectContent({
            contentType: 'page_engagement',
            itemId: getCurrentItemId(),
            itemName: getCurrentItemName(),
            sectionName: 'lifecycle',
            interactionAction: 'end',
            elementType: 'page',
            elementLabel: 'PAGE_END',
            sourceEvent: 'lifecycle',
            duration_ms: totalDurationMs,
            engagement_time_msec: visibleDurationMs,
            hidden_duration_ms: hiddenDurationMs,
            max_scroll_percent: analyticsSession.maxScrollPercent,
            page_type: analyticsSession.pageType,
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
                    itemId: getCurrentItemId(),
                    itemName: getCurrentItemName(),
                    sectionName: 'lifecycle',
                    interactionAction: 'start',
                    elementType: 'page',
                    elementLabel: 'PAGE_START',
                    sourceEvent: 'lifecycle',
                    page_type: analyticsSession.pageType
                });
            },
            onHidden: () => {
                trackSelectContent({
                    contentType: 'page_visibility',
                    itemId: getCurrentItemId(),
                    itemName: getCurrentItemName(),
                    sectionName: 'lifecycle',
                    interactionAction: 'hidden',
                    elementType: 'page',
                    elementLabel: 'PAGE_HIDDEN',
                    sourceEvent: 'lifecycle',
                    page_type: analyticsSession.pageType
                });
            },
            onVisible: () => {
                trackSelectContent({
                    contentType: 'page_visibility',
                    itemId: getCurrentItemId(),
                    itemName: getCurrentItemName(),
                    sectionName: 'lifecycle',
                    interactionAction: 'visible',
                    elementType: 'page',
                    elementLabel: 'PAGE_VISIBLE',
                    sourceEvent: 'lifecycle',
                    page_type: analyticsSession.pageType
                });
            },
            onEnd: endAnalyticsSession
        });
    }

    function trackInitialPageView() {
        if (analyticsSession.pageType === 'case_detail' && analyticsSession.caseNumber) {
            trackSelectContent({
                contentType: 'section_view',
                itemId: `case_${analyticsSession.caseNumber}`,
                itemName: analyticsSession.caseTitle || `Case ${analyticsSession.caseNumber}`,
                sectionName: 'case_review',
                interactionAction: 'view',
                elementType: 'page',
                elementLabel: `CASE_${analyticsSession.caseNumber}`
            });
            return;
        }

        trackSelectContent({
            contentType: 'section_view',
            itemId: 'case_review_list',
            itemName: 'Case Brief List',
            sectionName: 'case_review',
            interactionAction: 'view',
            elementType: 'page',
            elementLabel: 'CASE_LIST'
        });
    }

    return {
        analyticsSession,
        trackSelectContent,
        getCurrentItemId,
        getCurrentItemName,
        setupAnalyticsLifecycle,
        trackInitialPageView
    };
}

export function createCaseDetailInteractionTracking({
    trackSelectContent,
    getCurrentItemId,
    getCurrentItemName,
    getPageType,
    detectLinkType,
    isPerformanceEvidenceLink,
    parseCaseQueryFromHref,
    openEvidenceModalByElement,
    toSafeLabel
} = {}) {
    function setupInteractionTracking() {
        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-track-kind]');
            if (!trigger) {
                return;
            }

            const kind = trigger.dataset.trackKind || '';
            const href = trigger.getAttribute('href') || '';
            const itemId = getCurrentItemId?.();
            const itemName = getCurrentItemName?.();
            const pageType = getPageType?.() || '';

            if (kind === 'header_home') {
                trackSelectContent?.({
                    contentType: 'navigation',
                    itemId,
                    itemName,
                    sectionName: 'case_review_header',
                    interactionAction: 'navigate',
                    elementType: 'link',
                    elementLabel: 'BACK_TO_PORTFOLIO',
                    linkUrl: href,
                    linkType: detectLinkType?.(href),
                    page_type: pageType
                });
                return;
            }

            if (kind === 'case_list_card') {
                const caseIdRaw = String(trigger.dataset.caseNumber || '');
                const parsedNum = Number.parseInt(caseIdRaw, 10);
                const caseNumber = Number.isFinite(parsedNum) ? parsedNum : caseIdRaw;

                const caseTitle = trigger.dataset.caseTitle || `CASE ${caseNumber}`;
                trackSelectContent?.({
                    contentType: 'navigation_case',
                    itemId: caseNumber ? `case_${caseNumber}` : 'unknown_case',
                    itemName: caseTitle,
                    sectionName: 'case_list',
                    interactionAction: 'open_case',
                    elementType: 'card_link',
                    elementLabel: caseNumber ? `CASE_${caseNumber}` : 'CASE_UNKNOWN',
                    linkUrl: href,
                    linkType: detectLinkType?.(href),
                    value: typeof caseNumber === 'number' ? caseNumber : undefined
                });
                return;
            }

            if (kind === 'case_nav') {
                const navLabel = trigger.dataset.navLabel || trigger.textContent?.trim() || 'CASE_NAV';
                const destinationCase = parseCaseQueryFromHref?.(href);
                trackSelectContent?.({
                    contentType: 'navigation',
                    itemId,
                    itemName,
                    sectionName: 'case_review_navigation',
                    interactionAction: 'navigate',
                    elementType: 'link',
                    elementLabel: navLabel,
                    linkUrl: href,
                    linkType: detectLinkType?.(href),
                    destination_case: destinationCase || '',
                    page_type: pageType
                });
                return;
            }

            if (kind === 'traceability_link') {
                const linkLabel = trigger.dataset.linkLabel || trigger.textContent?.trim() || 'REFERENCE';
                const linkRole = trigger.dataset.linkRole || 'reference';
                const contentType = isPerformanceEvidenceLink?.(linkLabel, href) ? 'performance_evidence' : 'case_link';
                trackSelectContent?.({
                    contentType,
                    itemId,
                    itemName,
                    sectionName: 'traceability',
                    interactionAction: 'open_link',
                    elementType: 'link',
                    elementLabel: linkLabel,
                    linkUrl: href,
                    linkType: detectLinkType?.(href),
                    link_role: linkRole,
                    page_type: pageType
                });
                return;
            }

            if (kind === 'evidence_slot') {
                const phase = trigger.dataset.evidencePhase || 'other';
                const tier = trigger.dataset.evidenceTier || 'core';
                const evidenceLabel = trigger.dataset.evidenceLabel || 'EVIDENCE';
                const pairTitle = trigger.dataset.evidencePair || 'PAIR';
                const pairIndexRaw = Number.parseInt(trigger.dataset.evidencePairIndex || '', 10);
                const pairIndex = Number.isFinite(pairIndexRaw) ? pairIndexRaw : undefined;
                const baseLabel = typeof toSafeLabel === 'function'
                    ? toSafeLabel(evidenceLabel)
                    : String(evidenceLabel || 'EVIDENCE');
                const safeLabel = baseLabel.replace(/\s+/g, '_').toUpperCase();

                trackSelectContent?.({
                    contentType: 'performance_evidence',
                    itemId,
                    itemName,
                    sectionName: 'evidence_frame',
                    interactionAction: 'open_image',
                    elementType: 'image_link',
                    elementLabel: `${phase.toUpperCase()}_${safeLabel}`,
                    linkUrl: href,
                    linkType: detectLinkType?.(href),
                    evidence_phase: phase,
                    evidence_tier: tier,
                    evidence_pair: pairTitle,
                    evidence_pair_index: pairIndex,
                    page_type: pageType
                });

                const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
                if (isModifiedClick) {
                    return;
                }

                event.preventDefault();
                openEvidenceModalByElement?.(trigger);
            }
        });
    }

    return {
        setupInteractionTracking
    };
}
