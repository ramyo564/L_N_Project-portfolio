import { detectLinkType, inferDestinationPageType } from './link.js';

const DEFAULT_TRACKING_VERSION = '2026-03-ga4-unified-v1';

function pushDataLayerEvent(payload) {
    if (!payload || typeof payload !== 'object') {
        return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
}

function readScrollPercent() {
    const documentElement = document.documentElement;
    const maxScrollable = Math.max(0, documentElement.scrollHeight - window.innerHeight);
    if (maxScrollable <= 0) {
        return 100;
    }
    const ratio = (window.scrollY / maxScrollable) * 100;
    return Math.max(0, Math.min(100, Math.round(ratio)));
}

export function updateMaxScrollPercent(session) {
    if (!session || typeof session !== 'object') {
        return;
    }
    const currentValue = Number.isFinite(session.maxScrollPercent) ? session.maxScrollPercent : 0;
    session.maxScrollPercent = Math.max(currentValue, readScrollPercent());
}

export function stopVisibleTimer(session, timestamp = Date.now()) {
    if (!session || typeof session !== 'object' || !session.visibleStartedAt) {
        return;
    }
    session.visibleDurationMs += Math.max(0, timestamp - session.visibleStartedAt);
    session.visibleStartedAt = 0;
}

export function startVisibleTimer(session, timestamp = Date.now()) {
    if (!session || typeof session !== 'object') {
        return;
    }
    if (document.visibilityState === 'hidden' || session.visibleStartedAt) {
        return;
    }
    session.visibleStartedAt = timestamp;
}

export function createTrackSelectContent(options = {}) {
    const session = options.session && typeof options.session === 'object' ? options.session : {};
    const trackingVersion = options.trackingVersion || DEFAULT_TRACKING_VERSION;
    const getPageType = typeof options.getPageType === 'function'
        ? options.getPageType
        : () => session.pageType || '';

    return function trackSelectContent({
        contentType,
        itemId,
        itemName,
        sectionName,
        interactionAction = 'click',
        elementType,
        elementLabel,
        linkUrl,
        linkType,
        modalName,
        value,
        sourceEvent = 'ui_click',
        ...extra
    }) {
        const pageType = String(getPageType() || '');
        const resolvedDestinationUrl = String(linkUrl || extra.destination_url || '').trim();
        const payload = {
            event: 'select_content',
            tracking_version: trackingVersion,
            session_id: session.id || '',
            page_path: window.location.pathname,
            page_title: document.title,
            page_type: pageType,
            source_page_type: pageType,
            content_type: contentType || 'unknown',
            item_id: itemId || 'unknown',
            section_name: sectionName || 'unknown',
            interaction_action: interactionAction,
            source_event: sourceEvent
        };

        if (itemName) {
            payload.item_name = itemName;
        }
        if (elementType) {
            payload.element_type = elementType;
        }
        if (elementLabel) {
            payload.element_label = elementLabel;
        }
        if (linkType) {
            payload.link_type = linkType;
        }
        if (resolvedDestinationUrl) {
            payload.link_url = resolvedDestinationUrl;
            if (!payload.link_type) {
                payload.link_type = detectLinkType(resolvedDestinationUrl);
            }
            payload.destination_url = resolvedDestinationUrl;
            payload.destination_page_type = inferDestinationPageType(resolvedDestinationUrl, {
                currentPageType: pageType
            });
        }
        if (modalName) {
            payload.modal_name = modalName;
        }
        if (typeof value === 'number' && Number.isFinite(value)) {
            payload.value = value;
        }

        Object.entries(extra).forEach(([key, valueItem]) => {
            if (valueItem !== undefined && valueItem !== null && valueItem !== '') {
                payload[key] = valueItem;
            }
        });

        pushDataLayerEvent(payload);
    };
}

function invokeHandler(handler, arg) {
    if (typeof handler === 'function') {
        handler(arg);
    }
}

export function setupAnalyticsLifecycle({
    session,
    updateMaxScrollPercent: handleUpdateMaxScrollPercent,
    stopVisibleTimer: handleStopVisibleTimer,
    startVisibleTimer: handleStartVisibleTimer,
    onStart,
    onHidden,
    onVisible,
    onEnd
} = {}) {
    invokeHandler(handleUpdateMaxScrollPercent);
    invokeHandler(onStart);

    window.addEventListener('scroll', () => invokeHandler(handleUpdateMaxScrollPercent), { passive: true });

    document.addEventListener('visibilitychange', () => {
        if (session?.ended) {
            return;
        }

        if (document.visibilityState === 'hidden') {
            invokeHandler(handleStopVisibleTimer);
            invokeHandler(onHidden);
            return;
        }

        invokeHandler(handleStartVisibleTimer);
        invokeHandler(onVisible);
    });

    window.addEventListener('pagehide', () => invokeHandler(onEnd, 'pagehide'));
    window.addEventListener('beforeunload', () => invokeHandler(onEnd, 'beforeunload'));
}
