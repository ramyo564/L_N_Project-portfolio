import { templateConfig } from './config.js';

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

const evidenceModalState = {
    initialized: false,
    isOpen: false,
    openedAt: 0,
    currentIndex: -1,
    items: []
};

function byId(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function toSafeLabel(value) {
    return String(value ?? 'unknown').replace(/[^a-zA-Z0-9_-]+/g, ' ').trim() || 'unknown';
}

function pushDataLayerEvent(payload) {
    if (!payload || typeof payload !== 'object') {
        return;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
}

function detectLinkType(href) {
    const target = String(href || '').trim().toLowerCase();
    if (!target) {
        return 'unknown';
    }
    if (target.startsWith('mailto:')) {
        return 'mailto';
    }
    if (target.startsWith('#')) {
        return 'anchor';
    }
    if (target.startsWith('http://') || target.startsWith('https://')) {
        return 'external';
    }
    return 'internal';
}

function trackSelectContent({
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
    ...extra
}) {
    const payload = {
        event: 'select_content',
        session_id: analyticsSession.id,
        content_type: contentType || 'unknown',
        item_id: itemId || 'unknown',
        section_name: sectionName || 'unknown',
        interaction_action: interactionAction
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
    if (linkUrl) {
        payload.link_url = linkUrl;
    }
    if (linkType) {
        payload.link_type = linkType;
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
}

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

function readScrollPercent() {
    const documentElement = document.documentElement;
    const maxScrollable = Math.max(0, documentElement.scrollHeight - window.innerHeight);
    if (maxScrollable <= 0) {
        return 100;
    }
    const ratio = (window.scrollY / maxScrollable) * 100;
    return Math.max(0, Math.min(100, Math.round(ratio)));
}

function updateMaxScrollPercent() {
    analyticsSession.maxScrollPercent = Math.max(analyticsSession.maxScrollPercent, readScrollPercent());
}

function stopVisibleTimer(timestamp = Date.now()) {
    if (!analyticsSession.visibleStartedAt) {
        return;
    }
    analyticsSession.visibleDurationMs += Math.max(0, timestamp - analyticsSession.visibleStartedAt);
    analyticsSession.visibleStartedAt = 0;
}

function startVisibleTimer(timestamp = Date.now()) {
    if (document.visibilityState === 'hidden' || analyticsSession.visibleStartedAt) {
        return;
    }
    analyticsSession.visibleStartedAt = timestamp;
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
    updateMaxScrollPercent();

    trackSelectContent({
        contentType: 'page_engagement',
        itemId: getCurrentItemId(),
        itemName: getCurrentItemName(),
        sectionName: 'lifecycle',
        interactionAction: 'start',
        elementType: 'page',
        elementLabel: 'PAGE_START',
        page_type: analyticsSession.pageType
    });

    window.addEventListener('scroll', updateMaxScrollPercent, { passive: true });

    document.addEventListener('visibilitychange', () => {
        if (analyticsSession.ended) {
            return;
        }

        if (document.visibilityState === 'hidden') {
            stopVisibleTimer();
            trackSelectContent({
                contentType: 'page_visibility',
                itemId: getCurrentItemId(),
                itemName: getCurrentItemName(),
                sectionName: 'lifecycle',
                interactionAction: 'hidden',
                elementType: 'page',
                elementLabel: 'PAGE_HIDDEN',
                page_type: analyticsSession.pageType
            });
            return;
        }

        startVisibleTimer();
        trackSelectContent({
            contentType: 'page_visibility',
            itemId: getCurrentItemId(),
            itemName: getCurrentItemName(),
            sectionName: 'lifecycle',
            interactionAction: 'visible',
            elementType: 'page',
            elementLabel: 'PAGE_VISIBLE',
            page_type: analyticsSession.pageType
        });
    });

    window.addEventListener('pagehide', () => endAnalyticsSession('pagehide'));
    window.addEventListener('beforeunload', () => endAnalyticsSession('beforeunload'));
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

function getEvidenceModalElements() {
    return {
        modal: byId('case-evidence-modal'),
        image: byId('case-evidence-image'),
        title: byId('case-evidence-title'),
        phase: byId('case-evidence-phase'),
        counter: byId('case-evidence-counter'),
        prev: byId('case-evidence-prev'),
        next: byId('case-evidence-next'),
        openOriginal: byId('case-evidence-open-original')
    };
}

function buildEvidenceElementLabel(item) {
    const safeLabel = toSafeLabel(item?.label || 'EVIDENCE').replace(/\s+/g, '_').toUpperCase();
    const phase = String(item?.phase || 'other').toUpperCase();
    return `${phase}_${safeLabel}`;
}

function trackEvidenceModalEvent(currentItem, interactionAction, elementType, elementLabel, extra = {}) {
    if (!currentItem) {
        return;
    }

    trackSelectContent({
        contentType: 'performance_evidence',
        itemId: getCurrentItemId(),
        itemName: getCurrentItemName(),
        sectionName: 'evidence_modal',
        interactionAction,
        elementType,
        elementLabel,
        linkUrl: currentItem.href,
        linkType: detectLinkType(currentItem.href),
        modalName: 'case_evidence_modal',
        evidence_phase: currentItem.phase,
        evidence_tier: currentItem.tier,
        evidence_pair: currentItem.pair,
        evidence_pair_index: currentItem.pairIndex,
        page_type: analyticsSession.pageType,
        ...extra
    });
}

function rebuildEvidenceModalItems() {
    const evidenceElements = Array.from(document.querySelectorAll('[data-track-kind="evidence_slot"]'));
    evidenceModalState.items = evidenceElements.map((element, index) => {
        const href = element.getAttribute('href') || '';
        const phase = element.dataset.evidencePhase || 'other';
        const tier = element.dataset.evidenceTier || 'core';
        const pair = element.dataset.evidencePair || 'PAIR';
        const pairIndexRaw = Number.parseInt(element.dataset.evidencePairIndex || '', 10);
        const pairIndex = Number.isFinite(pairIndexRaw) ? pairIndexRaw : undefined;
        const label = element.dataset.evidenceLabel || element.textContent?.trim() || 'EVIDENCE';
        const image = element.querySelector('img');
        const alt = image?.getAttribute('alt') || label;

        element.dataset.evidenceModalIndex = String(index);

        return {
            href,
            phase,
            tier,
            pair,
            pairIndex,
            label,
            alt
        };
    });

    if (evidenceModalState.currentIndex >= evidenceModalState.items.length) {
        evidenceModalState.currentIndex = evidenceModalState.items.length - 1;
    }

    if (evidenceModalState.items.length === 0 && evidenceModalState.isOpen) {
        closeEvidenceModal('EMPTY_ITEMS');
    }
}

function updateEvidenceModalView() {
    const elements = getEvidenceModalElements();
    const items = evidenceModalState.items;
    const item = items[evidenceModalState.currentIndex];
    if (!elements.modal || !elements.image || !item) {
        return;
    }

    elements.image.src = item.href;
    elements.image.alt = item.alt || item.label || 'Evidence image';
    elements.title.textContent = `${item.pair} · ${item.label}`;
    elements.counter.textContent = `${evidenceModalState.currentIndex + 1} / ${items.length}`;

    const phaseClass = ['is-before', 'is-after', 'is-other'];
    elements.phase.classList.remove(...phaseClass);
    if (item.phase === 'before') {
        elements.phase.classList.add('is-before');
        elements.phase.textContent = 'BEFORE';
    } else if (item.phase === 'after') {
        elements.phase.classList.add('is-after');
        elements.phase.textContent = 'AFTER';
    } else {
        elements.phase.classList.add('is-other');
        elements.phase.textContent = 'EVIDENCE';
    }

    if (elements.prev) {
        elements.prev.disabled = evidenceModalState.currentIndex <= 0;
    }
    if (elements.next) {
        elements.next.disabled = evidenceModalState.currentIndex >= items.length - 1;
    }
    if (elements.openOriginal) {
        elements.openOriginal.href = item.href || '#';
    }
}

function openEvidenceModalAtIndex(index, openSource = 'slot_click') {
    const elements = getEvidenceModalElements();
    if (!elements.modal || evidenceModalState.items.length === 0) {
        return;
    }

    if (index < 0 || index >= evidenceModalState.items.length) {
        return;
    }

    evidenceModalState.currentIndex = index;
    updateEvidenceModalView();

    evidenceModalState.isOpen = true;
    evidenceModalState.openedAt = Date.now();
    elements.modal.classList.add('is-open');
    elements.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const currentItem = evidenceModalState.items[evidenceModalState.currentIndex];
    trackEvidenceModalEvent(
        currentItem,
        'open_modal',
        'modal',
        buildEvidenceElementLabel(currentItem),
        { open_source: openSource, value: evidenceModalState.currentIndex + 1 }
    );
}

function closeEvidenceModal(reason = 'CLOSE') {
    const elements = getEvidenceModalElements();
    if (!elements.modal || !evidenceModalState.isOpen) {
        return;
    }

    const currentItem = evidenceModalState.items[evidenceModalState.currentIndex];
    const durationMs = Math.max(0, Date.now() - evidenceModalState.openedAt);

    elements.modal.classList.remove('is-open');
    elements.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');

    evidenceModalState.isOpen = false;
    evidenceModalState.openedAt = 0;

    trackEvidenceModalEvent(
        currentItem,
        'close_modal',
        'button',
        reason,
        { duration_ms: durationMs, value: Math.round(durationMs / 1000) }
    );
}

function moveEvidenceModal(step, label) {
    if (!evidenceModalState.isOpen || evidenceModalState.items.length === 0) {
        return;
    }

    const nextIndex = evidenceModalState.currentIndex + step;
    if (nextIndex < 0 || nextIndex >= evidenceModalState.items.length) {
        return;
    }

    evidenceModalState.currentIndex = nextIndex;
    updateEvidenceModalView();

    const currentItem = evidenceModalState.items[evidenceModalState.currentIndex];
    trackEvidenceModalEvent(
        currentItem,
        'navigate_modal',
        'button',
        label,
        { value: evidenceModalState.currentIndex + 1 }
    );
}

function openEvidenceModalByElement(element) {
    if (!element) {
        return;
    }

    const indexRaw = Number.parseInt(element.dataset.evidenceModalIndex || '', 10);
    if (!Number.isFinite(indexRaw)) {
        return;
    }

    openEvidenceModalAtIndex(indexRaw, 'evidence_slot');
}

function setupEvidenceModalControls() {
    if (evidenceModalState.initialized) {
        return;
    }

    const elements = getEvidenceModalElements();
    if (!elements.modal) {
        return;
    }

    evidenceModalState.initialized = true;

    elements.modal.addEventListener('click', (event) => {
        if (!event.target.closest('[data-evidence-close]')) {
            return;
        }
        closeEvidenceModal('CLOSE');
    });

    if (elements.prev) {
        elements.prev.addEventListener('click', () => {
            moveEvidenceModal(-1, 'PREV');
        });
    }

    if (elements.next) {
        elements.next.addEventListener('click', () => {
            moveEvidenceModal(1, 'NEXT');
        });
    }

    if (elements.openOriginal) {
        elements.openOriginal.addEventListener('click', () => {
            if (!evidenceModalState.isOpen) {
                return;
            }
            const currentItem = evidenceModalState.items[evidenceModalState.currentIndex];
            trackEvidenceModalEvent(currentItem, 'open_original', 'link', 'OPEN_ORIGINAL');
        });
    }

    document.addEventListener('keydown', (event) => {
        if (!evidenceModalState.isOpen) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeEvidenceModal('ESCAPE');
            return;
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            moveEvidenceModal(-1, 'PREV');
            return;
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            moveEvidenceModal(1, 'NEXT');
        }
    });
}

function parseCaseNumber(card) {
    const title = String(card?.title || '');
    const titleMatch = title.match(/Case\s*(\d+)/i);
    if (titleMatch) {
        return Number.parseInt(titleMatch[1], 10);
    }

    const anchorId = String(card?.anchorId || '');
    const anchorMatch = anchorId.match(/case-(\d+)/i);
    if (anchorMatch) {
        return Number.parseInt(anchorMatch[1], 10);
    }

    return null;
}

function splitNarrativeLines(text) {
    const rawLines = String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    return rawLines
        .map((line) => line.replace(/^\d+\)\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
}

function detectEvidencePhase(item) {
    const searchSpace = `${item?.label || ''} ${item?.src || ''}`.toLowerCase();
    if (searchSpace.includes('before')) {
        return 'before';
    }
    if (searchSpace.includes('after')) {
        return 'after';
    }
    return 'other';
}

function normalizeEvidenceLabel(label) {
    return String(label || '')
        .toLowerCase()
        .replace(/\bbefore\b|\bafter\b/g, ' ')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildEvidencePairKey(item) {
    const explicitKey = String(item?.pairKey || '').trim().toLowerCase();
    if (explicitKey) {
        return explicitKey;
    }

    const normalizedLabel = normalizeEvidenceLabel(item?.label || '');
    if (normalizedLabel) {
        if (normalizedLabel.includes('k6')) {
            return normalizedLabel
                .replace(/\b\d+\s*vu\b/g, ' ')
                .replace(/\b\d+\b/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }
        return normalizedLabel;
    }

    return String(item?.src || '')
        .toLowerCase()
        .replace(/\bbefore\b|\bafter\b/g, ' ')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeEvidenceItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .filter((item) => item && item.src)
        .map((item) => ({
            label: item.label || 'EVIDENCE',
            src: item.src,
            alt: item.alt || item.label || 'evidence image',
            phase: detectEvidencePhase(item),
            pairKey: item.pairKey || '',
            missingBeforeReason: item.missingBeforeReason || '',
            missingAfterReason: item.missingAfterReason || ''
        }));
}

function isCaseRunbookLink(href) {
    return /(?:^|\/)case\d+\/CASE-\d+\.md$/i.test(String(href || '').trim());
}

function isPerformanceEvidenceLink(label, href) {
    const text = `${label || ''} ${href || ''}`.toLowerCase();
    return text.includes('performance_evidence')
        || text.includes('k6')
        || text.includes('report.html')
        || text.includes('summary.json')
        || text.includes('failure-summary');
}

function parseCaseQueryFromHref(href) {
    try {
        const targetUrl = new URL(String(href || ''), window.location.href);
        const raw = targetUrl.searchParams.get('case') || '';
        const value = Number.parseInt(raw, 10);
        return Number.isFinite(value) ? value : null;
    } catch (_error) {
        return null;
    }
}

function collectCaseCards() {
    const cards = [];
    const serviceSections = Array.isArray(templateConfig?.serviceSections) ? templateConfig.serviceSections : [];

    serviceSections.forEach((section) => {
        const groups = Array.isArray(section?.groups) ? section.groups : [];
        groups.forEach((group) => {
            const groupCards = Array.isArray(group?.cards) ? group.cards : [];
            groupCards.forEach((card) => {
                const caseNumber = parseCaseNumber(card);
                if (!caseNumber) {
                    return;
                }

                cards.push({
                    caseNumber,
                    sectionTitle: section?.title || '',
                    groupTitle: group?.title || '',
                    card
                });
            });
        });
    });

    return cards.sort((a, b) => a.caseNumber - b.caseNumber);
}

function buildEvidencePairs(items) {
    const grouped = new Map();

    items.forEach((item) => {
        const key = buildEvidencePairKey(item);
        if (!grouped.has(key)) {
            grouped.set(key, { before: [], after: [], other: [] });
        }

        const bucket = grouped.get(key);
        if (item.phase === 'before') {
            bucket.before.push(item);
            return;
        }
        if (item.phase === 'after') {
            bucket.after.push(item);
            return;
        }
        bucket.other.push(item);
    });

    const pairs = [];
    grouped.forEach((bucket, key) => {
        const beforeItems = [...bucket.before, ...bucket.other];
        const afterItems = bucket.after;
        const pairCount = Math.max(beforeItems.length, afterItems.length);

        for (let index = 0; index < pairCount; index += 1) {
            pairs.push({
                key,
                before: beforeItems[index] || null,
                after: afterItems[index] || null
            });
        }
    });

    return pairs;
}

function sanitizePairTitle(label) {
    const cleaned = normalizeEvidenceLabel(label || '')
        .replace(/\b(before|after)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleaned) {
        return '';
    }
    return cleaned.toUpperCase();
}

function buildEvidenceSlotHtml(item, phase, missingReason, options = {}) {
    const phaseLabel = phase === 'before' ? 'BEFORE' : 'AFTER';
    const toneClass = phase === 'before' ? 'is-before' : 'is-after';
    const pairTitle = options.pairTitle || 'PAIR';
    const pairIndex = options.pairIndex || 0;
    const tier = options.tier || 'core';

    if (!item) {
        return `
            <div class="case-evidence-slot case-evidence-slot-missing ${toneClass}">
                <span class="case-evidence-phase-badge ${toneClass}">${phaseLabel}</span>
                <p class="case-evidence-missing-text">${escapeHtml(missingReason || 'N/A')}</p>
            </div>
        `;
    }

    return `
        <a
            class="case-evidence-slot ${toneClass}"
            href="${escapeHtml(item.src)}"
            target="_blank"
            rel="noopener noreferrer"
            data-track-kind="evidence_slot"
            data-evidence-phase="${escapeHtml(phase)}"
            data-evidence-tier="${escapeHtml(tier)}"
            data-evidence-label="${escapeHtml(item.label)}"
            data-evidence-pair="${escapeHtml(pairTitle)}"
            data-evidence-pair-index="${pairIndex}"
        >
            <span class="case-evidence-phase-badge ${toneClass}">${phaseLabel}</span>
            <img loading="lazy" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}">
            <span class="case-evidence-slot-caption">${escapeHtml(item.label)}</span>
        </a>
    `;
}

function buildEvidencePairsHtml(items, tier) {
    if (items.length === 0) {
        return '<p class="case-review-empty">등록된 이미지 증거가 없습니다.</p>';
    }

    const pairs = buildEvidencePairs(items);
    if (pairs.length === 0) {
        return '<p class="case-review-empty">Before/After 페어를 구성할 수 있는 증거가 없습니다.</p>';
    }

    return `
        <div class="case-evidence-pairs">
            ${pairs.map((pair, index) => {
                const pairTitle = sanitizePairTitle(pair.before?.label || pair.after?.label || pair.key) || `PAIR ${index + 1}`;
                const missingBeforeReason = !pair.before ? pair.after?.missingBeforeReason : '';
                const missingAfterReason = !pair.after ? pair.before?.missingAfterReason : '';

                return `
                <article class="case-evidence-pair-card">
                    <p class="case-evidence-pair-title">PAIR ${index + 1} · ${escapeHtml(pairTitle)}</p>
                    <div class="case-evidence-frame">
                        ${buildEvidenceSlotHtml(pair.before, 'before', missingBeforeReason, { pairTitle, pairIndex: index + 1, tier })}
                        ${buildEvidenceSlotHtml(pair.after, 'after', missingAfterReason, { pairTitle, pairIndex: index + 1, tier })}
                    </div>
                </article>
                `;
            }).join('')}
        </div>
    `;
}

function buildSummaryBlock(title, items) {
    const content = items.length === 0
        ? '<li>정리 문구가 아직 비어 있습니다.</li>'
        : items.map((line) => `<li>${escapeHtml(line)}</li>`).join('');

    return `
        <article class="case-summary-card">
            <h3>${escapeHtml(title)}</h3>
            <ul>${content}</ul>
        </article>
    `;
}

function buildCaseList(root, cards) {
    root.innerHTML = `
        <section class="case-review-panel">
            <p class="case-kicker">SELECT_CASE</p>
            <h1>심사자용 케이스 브리프</h1>
            <p class="case-subtitle">각 케이스는 문제, 원인, 해결, 결과를 먼저 확인하도록 구성됩니다.</p>
            <div class="case-list-grid">
                ${cards.map(({ caseNumber, card, groupTitle }) => `
                    <a
                        class="case-list-card"
                        href="./case-detail.html?case=${caseNumber}"
                        data-track-kind="case_list_card"
                        data-case-number="${caseNumber}"
                        data-case-title="${escapeHtml(card?.title || '')}"
                    >
                        <p class="case-list-id">CASE ${caseNumber}</p>
                        <h2>${escapeHtml(card?.title || '')}</h2>
                        <p>${escapeHtml(groupTitle)}</p>
                    </a>
                `).join('')}
            </div>
        </section>
    `;
}

function buildCaseDetail(root, cards, selected) {
    const { caseNumber, groupTitle, card } = selected;
    const cardLinks = Array.isArray(card?.links) ? card.links.filter((item) => item?.href) : [];
    const runbookLink = cardLinks.find((item) => isCaseRunbookLink(item.href)) || null;
    const referenceLinks = cardLinks.filter((item) => !isCaseRunbookLink(item.href));

    const summaryProblem = splitNarrativeLines(card?.problem);
    const summaryCause = splitNarrativeLines(card?.cause);
    const summarySolution = splitNarrativeLines(card?.solution);
    const summaryResult = splitNarrativeLines(card?.result);

    const coreEvidence = normalizeEvidenceItems(card?.evidenceImages);
    const extraEvidence = normalizeEvidenceItems(card?.extraEvidenceImages);
    const allEvidence = coreEvidence.concat(extraEvidence);
    const missingReasons = Array.from(new Set(
        allEvidence
            .flatMap((item) => [item.missingBeforeReason, item.missingAfterReason])
            .filter(Boolean)
    ));

    const index = cards.findIndex((item) => item.caseNumber === caseNumber);
    const prev = index > 0 ? cards[index - 1] : null;
    const next = index < cards.length - 1 ? cards[index + 1] : null;

    document.title = `Case ${caseNumber} Review | Yohan Portfolio`;

    const referenceButtons = [];
    if (runbookLink) {
        referenceButtons.push(`
            <a
                class="case-link-btn case-link-btn-runbook"
                href="${escapeHtml(runbookLink.href)}"
                target="_blank"
                rel="noopener noreferrer"
                data-track-kind="traceability_link"
                data-link-label="RUNBOOK_MD"
                data-link-role="runbook"
            >
                RUNBOOK_MD
            </a>
        `);
    }
    referenceLinks.forEach((item) => {
        const label = String(item.label || 'REFERENCE').trim() || 'REFERENCE';
        referenceButtons.push(`
            <a
                class="case-link-btn"
                href="${escapeHtml(item.href)}"
                target="_blank"
                rel="noopener noreferrer"
                data-track-kind="traceability_link"
                data-link-label="${escapeHtml(label)}"
                data-link-role="reference"
            >
                ${escapeHtml(label)}
            </a>
        `);
    });

    root.innerHTML = `
        <section class="case-review-panel case-review-hero-panel">
            <p class="case-kicker">CASE_${caseNumber}_BRIEF</p>
            <h1>${escapeHtml(card?.title || '')}</h1>
            <p class="case-subtitle">${escapeHtml(card?.subtitle || '')}</p>
            <div class="case-chip-row">
                <span class="case-chip">${escapeHtml(groupTitle)}</span>
                <span class="case-chip">${escapeHtml(card?.stackSummary || 'Stack summary 없음')}</span>
            </div>
            <div class="case-nav-row">
                <a
                    class="case-nav-btn"
                    href="./index.html#${escapeHtml(card?.anchorId || '')}"
                    data-track-kind="case_nav"
                    data-nav-label="BACK_TO_MAIN_CASE_CARD"
                >
                    BACK_TO_MAIN_CASE_CARD
                </a>
                ${prev ? `
                    <a
                        class="case-nav-btn"
                        href="./case-detail.html?case=${prev.caseNumber}"
                        data-track-kind="case_nav"
                        data-nav-label="PREV_CASE_${prev.caseNumber}"
                    >
                        PREV_CASE_${prev.caseNumber}
                    </a>
                ` : ''}
                ${next ? `
                    <a
                        class="case-nav-btn"
                        href="./case-detail.html?case=${next.caseNumber}"
                        data-track-kind="case_nav"
                        data-nav-label="NEXT_CASE_${next.caseNumber}"
                    >
                        NEXT_CASE_${next.caseNumber}
                    </a>
                ` : ''}
            </div>
        </section>

        <section class="case-review-panel">
            <p class="section-kicker">REVIEWER_SUMMARY</p>
            <div class="case-summary-grid">
                ${buildSummaryBlock('문제', summaryProblem)}
                ${buildSummaryBlock('원인', summaryCause)}
                ${buildSummaryBlock('해결', summarySolution)}
                ${buildSummaryBlock('결과', summaryResult)}
            </div>
        </section>

        <section class="case-review-panel">
            <p class="section-kicker">EVIDENCE_AT_A_GLANCE</p>
            <h2>핵심 증거 (Before/After Frame)</h2>
            ${buildEvidencePairsHtml(coreEvidence, 'core')}
            <h2 class="case-section-subtitle">보조 증거</h2>
            ${buildEvidencePairsHtml(extraEvidence, 'extra')}
            ${missingReasons.length > 0 ? `
                <div class="case-note-box">
                    <h3>N/A / 단측 증거 사유</h3>
                    <ul>
                        ${missingReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </section>

        <section class="case-review-panel">
            <p class="section-kicker">TRACEABILITY</p>
            <h2>원문 및 코드 추적 링크</h2>
            <div class="case-link-row">
                ${referenceButtons.join('')}
            </div>
        </section>
    `;
}

function setupInteractionTracking() {
    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-track-kind]');
        if (!trigger) {
            return;
        }

        const kind = trigger.dataset.trackKind || '';
        const href = trigger.getAttribute('href') || '';
        const itemId = getCurrentItemId();
        const itemName = getCurrentItemName();

        if (kind === 'header_home') {
            trackSelectContent({
                contentType: 'navigation',
                itemId,
                itemName,
                sectionName: 'case_review_header',
                interactionAction: 'navigate',
                elementType: 'link',
                elementLabel: 'BACK_TO_PORTFOLIO',
                linkUrl: href,
                linkType: detectLinkType(href),
                page_type: analyticsSession.pageType
            });
            return;
        }

        if (kind === 'case_list_card') {
            const caseNumber = Number.parseInt(trigger.dataset.caseNumber || '', 10);
            const caseTitle = trigger.dataset.caseTitle || `CASE ${caseNumber}`;
            trackSelectContent({
                contentType: 'navigation_case',
                itemId: Number.isFinite(caseNumber) ? `case_${caseNumber}` : 'unknown_case',
                itemName: caseTitle,
                sectionName: 'case_list',
                interactionAction: 'open_case',
                elementType: 'card_link',
                elementLabel: Number.isFinite(caseNumber) ? `CASE_${caseNumber}` : 'CASE_UNKNOWN',
                linkUrl: href,
                linkType: detectLinkType(href),
                value: Number.isFinite(caseNumber) ? caseNumber : undefined
            });
            return;
        }

        if (kind === 'case_nav') {
            const navLabel = trigger.dataset.navLabel || trigger.textContent?.trim() || 'CASE_NAV';
            const destinationCase = parseCaseQueryFromHref(href);
            trackSelectContent({
                contentType: 'navigation',
                itemId,
                itemName,
                sectionName: 'case_review_navigation',
                interactionAction: 'navigate',
                elementType: 'link',
                elementLabel: navLabel,
                linkUrl: href,
                linkType: detectLinkType(href),
                destination_case: destinationCase || '',
                page_type: analyticsSession.pageType
            });
            return;
        }

        if (kind === 'traceability_link') {
            const linkLabel = trigger.dataset.linkLabel || trigger.textContent?.trim() || 'REFERENCE';
            const linkRole = trigger.dataset.linkRole || 'reference';
            const contentType = isPerformanceEvidenceLink(linkLabel, href) ? 'performance_evidence' : 'case_link';
            trackSelectContent({
                contentType,
                itemId,
                itemName,
                sectionName: 'traceability',
                interactionAction: 'open_link',
                elementType: 'link',
                elementLabel: linkLabel,
                linkUrl: href,
                linkType: detectLinkType(href),
                link_role: linkRole,
                page_type: analyticsSession.pageType
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
            const safeLabel = toSafeLabel(evidenceLabel).replace(/\s+/g, '_').toUpperCase();

            trackSelectContent({
                contentType: 'performance_evidence',
                itemId,
                itemName,
                sectionName: 'evidence_frame',
                interactionAction: 'open_image',
                elementType: 'image_link',
                elementLabel: `${phase.toUpperCase()}_${safeLabel}`,
                linkUrl: href,
                linkType: detectLinkType(href),
                evidence_phase: phase,
                evidence_tier: tier,
                evidence_pair: pairTitle,
                evidence_pair_index: pairIndex,
                page_type: analyticsSession.pageType
            });

            const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
            if (isModifiedClick) {
                return;
            }

            event.preventDefault();
            openEvidenceModalByElement(trigger);
        }
    });
}

function init() {
    const root = byId('case-review-root');
    if (!root) {
        return;
    }

    setupInteractionTracking();
    setupEvidenceModalControls();

    const cards = collectCaseCards();
    if (cards.length === 0) {
        root.innerHTML = `
            <section class="case-review-panel">
                <h1>케이스 데이터가 비어 있습니다.</h1>
            </section>
        `;
        rebuildEvidenceModalItems();
        analyticsSession.pageType = 'case_list';
        analyticsSession.caseNumber = null;
        analyticsSession.caseTitle = 'Case Brief List';
        setupAnalyticsLifecycle();
        trackInitialPageView();
        return;
    }

    const caseParam = Number.parseInt(new URLSearchParams(window.location.search).get('case') || '', 10);
    const selected = cards.find((item) => item.caseNumber === caseParam);

    if (!selected) {
        buildCaseList(root, cards);
        rebuildEvidenceModalItems();
        analyticsSession.pageType = 'case_list';
        analyticsSession.caseNumber = null;
        analyticsSession.caseTitle = 'Case Brief List';
        setupAnalyticsLifecycle();
        trackInitialPageView();
        return;
    }

    buildCaseDetail(root, cards, selected);
    rebuildEvidenceModalItems();
    analyticsSession.pageType = 'case_detail';
    analyticsSession.caseNumber = selected.caseNumber;
    analyticsSession.caseTitle = selected.card?.title || `Case ${selected.caseNumber}`;
    setupAnalyticsLifecycle();
    trackInitialPageView();
}

init();
