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
