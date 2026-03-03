import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
import { templateConfig } from './config.js';

const baseMermaidConfig = {
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'linear'
    }
};

const mermaidConfig = {
    ...baseMermaidConfig,
    ...(templateConfig.mermaid ?? {}),
    flowchart: {
        ...baseMermaidConfig.flowchart,
        ...(templateConfig.mermaid?.flowchart ?? {})
    }
};

mermaid.initialize(mermaidConfig);

function byId(id) {
    return document.getElementById(id);
}

function normalizeHashTarget(target) {
    if (!target) {
        return '#';
    }
    return target.startsWith('#') ? target : `#${target}`;
}

function toSafeLabel(value) {
    return String(value ?? 'unknown').replace(/[^a-zA-Z0-9_-]+/g, ' ').trim() || 'unknown';
}

let mermaidRenderSequence = 0;

async function renderMermaidContainer(container, options = {}) {
    if (!(container instanceof HTMLElement)) {
        return;
    }

    const shouldForce = Boolean(options?.force);
    if (!shouldForce && container.querySelector('svg')) {
        return;
    }

    // Mermaid 재렌더 시 이전 처리 상태가 남아 있으면 raw text만 남을 수 있어 초기화합니다.
    container.removeAttribute('data-processed');

    const mermaidId = container.getAttribute('data-mermaid-id') || '';
    const diagrams = templateConfig.diagrams ?? {};
    if (mermaidId && diagrams[mermaidId]) {
        container.innerHTML = diagrams[mermaidId];
    } else {
        const label = toSafeLabel(mermaidId || 'undefined_id');
        container.innerHTML = `
            graph TD
            A[${label}] --> B[Define templateConfig.diagrams entry]
        `;
    }

    mermaidRenderSequence += 1;
    const tempClass = `mermaid-reflow-target-${mermaidRenderSequence}`;
    container.classList.add(tempClass);
    try {
        await mermaid.run({ querySelector: `.${tempClass}` });
    } catch (error) {
        console.error('Mermaid re-render failed for node:', container, error);
        const failedId = container.getAttribute('data-mermaid-id') || 'unknown';
        container.innerHTML = `<p style="margin:0;color:#ffb4b4;">Diagram render failed: ${failedId}</p>`;
    } finally {
        container.classList.remove(tempClass);
    }
}

function rerenderVisibleCardDiagrams(entries, options = {}) {
    const force = Boolean(options?.force);
    const candidates = Array.isArray(entries)
        ? entries
            .map((entry) => entry?.element instanceof HTMLElement ? entry.element : null)
            .filter(Boolean)
            .filter((element) => !element.hidden)
            .map((element) => element.querySelector('.mermaid'))
            .filter((node) => node instanceof HTMLElement)
            .filter((node) => force || !node.querySelector('svg'))
        : [];

    if (candidates.length === 0) {
        return;
    }

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            (async () => {
                for (const container of candidates) {
                    // Mermaid 내부 상태 충돌을 피하기 위해 순차적으로 렌더합니다.
                    // eslint-disable-next-line no-await-in-loop
                    await renderMermaidContainer(container, { force: true });
                }
            })();
        });
    });
}

function setText(id, value) {
    const el = byId(id);
    if (el && value) {
        el.textContent = value;
    }
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

function parseCaseRunbookNumber(href) {
    const text = String(href || '').trim();
    const match = text.match(/(?:^|\/)case(\d+)\/CASE-\d+\.md$/i);
    if (!match) {
        return null;
    }
    const caseNumber = Number.parseInt(match[1], 10);
    return Number.isFinite(caseNumber) ? caseNumber : null;
}

function toCaseReviewLink(href) {
    const caseNumber = parseCaseRunbookNumber(href);
    if (!caseNumber) {
        return String(href || '');
    }
    return `./case-detail.html?case=${caseNumber}`;
}

const analyticsSession = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
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
        itemName: document.title || 'Upgrade Todo Portfolio',
        sectionName: 'lifecycle',
        interactionAction: 'end',
        elementType: 'page',
        elementLabel: 'PAGE_END',
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
    updateMaxScrollPercent();

    trackSelectContent({
        contentType: 'page_engagement',
        itemId: 'portfolio_page',
        itemName: document.title || 'Upgrade Todo Portfolio',
        sectionName: 'lifecycle',
        interactionAction: 'start',
        elementType: 'page',
        elementLabel: 'PAGE_START'
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
                itemId: 'portfolio_page',
                itemName: document.title || 'Upgrade Todo Portfolio',
                sectionName: 'lifecycle',
                interactionAction: 'hidden',
                elementType: 'page',
                elementLabel: 'PAGE_HIDDEN'
            });
            return;
        }

        startVisibleTimer();
        trackSelectContent({
            contentType: 'page_visibility',
            itemId: 'portfolio_page',
            itemName: document.title || 'Upgrade Todo Portfolio',
            sectionName: 'lifecycle',
            interactionAction: 'visible',
            elementType: 'page',
            elementLabel: 'PAGE_VISIBLE'
        });
    });

    window.addEventListener('pagehide', () => endAnalyticsSession('pagehide'));
    window.addEventListener('beforeunload', () => endAnalyticsSession('beforeunload'));
}

function syncModalBodyLock() {
    const hasOpenModal = Boolean(
        document.querySelector('.mermaid-modal.is-open, .extra-evidence-modal.is-open, .k6-overview-modal.is-open')
    );
    document.body.classList.toggle('modal-open', hasOpenModal);
}

function setupUptime() {
    const uptimeElement = byId('uptime');
    if (!uptimeElement) {
        return;
    }

    const startTime = new Date();
    const updateUptime = () => {
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        uptimeElement.textContent = `${h}:${m}:${s}`;
    };

    updateUptime();
    setInterval(updateUptime, 1000);
}

function setupMobileNav() {
    const nav = byId('header-nav');
    const toggle = document.querySelector('.nav-toggle');
    if (!nav || !toggle) {
        return;
    }

    const closeNav = () => {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    const openNav = () => {
        nav.classList.add('is-open');
        toggle.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        const willClose = nav.classList.contains('is-open');
        if (willClose) {
            closeNav();
        } else {
            openNav();
        }

        trackSelectContent({
            contentType: 'navigation',
            itemId: 'header_nav_toggle',
            itemName: willClose ? 'close' : 'open',
            sectionName: 'header_nav',
            interactionAction: willClose ? 'close' : 'open',
            elementType: 'button',
            elementLabel: 'NAV_TOGGLE'
        });
    });

    nav.addEventListener('click', (event) => {
        const target = event.target;
        if (
            target instanceof HTMLElement &&
            (target.classList.contains('nav-item') || target.classList.contains('nav-sub-item'))
        ) {
            closeNav();
        }
    });

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }
        if (!nav.contains(target) && !toggle.contains(target)) {
            closeNav();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeNav();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeNav();
        }
    });
}

function setSystemInfo() {
    if (templateConfig.system?.documentTitle) {
        document.title = templateConfig.system.documentTitle;
    }
    setText('system-name', templateConfig.system?.systemName);
}

let openK6OverviewModal = null;
let caseShowcaseControllers = [];

function renderHero() {
    const hero = templateConfig.hero ?? {};
    const section = byId('system-architecture');
    const metrics = byId('hero-metrics');
    const mermaidContainer = byId('hero-mermaid');

    if (section && hero.sectionId) {
        section.id = hero.sectionId;
    }
    setText('hero-panel-title', hero.panelTitle);
    setText('hero-panel-uid', hero.panelUid);

    if (mermaidContainer && hero.diagramId) {
        mermaidContainer.setAttribute('data-mermaid-id', hero.diagramId);
    }

    if (!metrics) {
        return;
    }
    metrics.replaceChildren();
    const headline = String(hero.headline || '').trim();
    if (headline) {
        const headlineNode = document.createElement('div');
        headlineNode.className = 'hero-headline';
        headlineNode.textContent = headline;
        metrics.appendChild(headlineNode);
    }
    const hasHeadlineItems = renderHeroHeadlineItems(metrics, hero.headlineItems);

    const hasSummaryRows = renderHeroSummaryRows(metrics, hero.summaryRows);
    const hasKpiCards = renderHeroKpiCards(metrics, hero.kpiCards);
    if (!headline && !hasHeadlineItems && !hasSummaryRows && !hasKpiCards) {
        renderMetricLines(metrics, hero.metrics, '> Add metrics in templateConfig.hero.metrics');
    }

    if (!section) {
        return;
    }

    let diagramNote = section.querySelector('.hero-diagram-note');
    const diagramNoteText = String(hero.diagramNote || '').trim();
    if (diagramNoteText) {
        if (!(diagramNote instanceof HTMLElement)) {
            diagramNote = document.createElement('div');
            diagramNote.className = 'hero-diagram-note';
            section.appendChild(diagramNote);
        }
        diagramNote.textContent = diagramNoteText;
    } else if (diagramNote instanceof HTMLElement) {
        diagramNote.remove();
    }

    let actions = section.querySelector('.hero-actions');
    if (!(actions instanceof HTMLElement)) {
        actions = document.createElement('div');
        actions.className = 'hero-actions';
        section.appendChild(actions);
    }

    actions.replaceChildren();
    if (hero.k6Overview) {
        const button = document.createElement('button');
        button.className = 'hero-action-btn';
        button.type = 'button';
        button.textContent = hero.k6ButtonLabel || 'K6_TEST_ENVIRONMENT';
        button.setAttribute('aria-haspopup', 'dialog');
        button.addEventListener('click', () => {
            if (typeof openK6OverviewModal === 'function') {
                openK6OverviewModal(hero.k6Overview, hero.k6ButtonLabel || 'K6_TEST_ENVIRONMENT');
            }

            trackSelectContent({
                contentType: 'hero_action',
                itemId: 'k6_test_environment',
                itemName: hero.k6ButtonLabel || 'K6_TEST_ENVIRONMENT',
                sectionName: 'hero',
                interactionAction: 'open_modal',
                elementType: 'button',
                elementLabel: hero.k6ButtonLabel || 'K6_TEST_ENVIRONMENT',
                modalName: 'k6_overview_modal'
            });
        });
        actions.appendChild(button);
    }

    if (actions.childElementCount === 0) {
        actions.remove();
    }
}

function renderHeroSummaryRows(container, rows) {
    const summaryRows = Array.isArray(rows)
        ? rows.filter((item) => item && (item.label || item.value))
        : [];
    if (summaryRows.length === 0) {
        return false;
    }

    const wrapper = document.createElement('section');
    wrapper.className = 'hero-summary-grid';

    summaryRows.forEach((row) => {
        const item = document.createElement('article');
        item.className = 'hero-summary-row';

        const label = document.createElement('span');
        label.className = 'hero-summary-label';
        label.textContent = row.label || '요약';

        const value = document.createElement('span');
        value.className = 'hero-summary-value';
        value.textContent = row.value || '';

        item.append(label, value);
        wrapper.appendChild(item);
    });

    container.appendChild(wrapper);
    return true;
}

function renderHeroHeadlineItems(container, items) {
    const lines = Array.isArray(items)
        ? items.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
    if (lines.length === 0) {
        return false;
    }

    const grid = document.createElement('section');
    grid.className = 'hero-headline-grid';

    lines.forEach((line) => {
        const item = document.createElement('article');
        item.className = 'hero-headline-item';
        item.textContent = line;
        grid.appendChild(item);
    });

    container.appendChild(grid);
    return true;
}

function renderHeroKpiCards(container, cards) {
    const kpiCards = Array.isArray(cards)
        ? cards.filter((item) => item && (item.label || item.value))
        : [];
    if (kpiCards.length === 0) {
        return false;
    }

    const grid = document.createElement('section');
    grid.className = 'hero-kpi-grid';

    kpiCards.forEach((cardItem) => {
        const card = document.createElement('article');
        card.className = 'hero-kpi-card';

        const label = document.createElement('div');
        label.className = 'hero-kpi-label';
        label.textContent = cardItem.label || '';

        const value = document.createElement('div');
        value.className = 'hero-kpi-value';
        value.textContent = cardItem.value || '';

        card.append(label, value);

        if (cardItem.delta) {
            const delta = document.createElement('div');
            delta.className = 'hero-kpi-delta';
            delta.textContent = cardItem.delta;
            card.appendChild(delta);
        }

        grid.appendChild(card);
    });

    container.appendChild(grid);
    return true;
}

function renderMetricLines(container, lines, fallbackText) {
    const metricLines = Array.isArray(lines) ? lines : [];
    if (metricLines.length === 0) {
        const fallback = document.createElement('p');
        fallback.textContent = fallbackText;
        container.appendChild(fallback);
        return;
    }

    metricLines.forEach((line) => {
        const isObjectLine = line && typeof line === 'object' && !Array.isArray(line);
        const labelText = isObjectLine ? String(line.label ?? '').trim() : '';
        const valueText = isObjectLine ? String(line.value ?? '').trim() : '';
        const plainText = String(isObjectLine ? line.text ?? '' : line ?? '').replace(/^>\s*/, '').trim();

        if (!plainText && !valueText) {
            return;
        }

        const item = document.createElement('p');
        item.className = 'hero-line';

        if (isObjectLine && String(line.kind ?? '').toLowerCase() === 'metric') {
            item.classList.add('is-metric');
        }

        if (labelText && valueText) {
            const label = document.createElement('span');
            label.className = 'hero-line-label';
            label.textContent = `${labelText}:`;

            const value = document.createElement('span');
            value.className = 'hero-line-value';
            value.textContent = valueText;

            item.append(label, value);
        } else {
            item.textContent = isObjectLine ? plainText : `> ${plainText}`;
        }

        container.appendChild(item);
    });
}

function createTopPanel(panel, index) {
    const section = document.createElement('section');
    section.className = `panel hero-panel ${panel.panelClass ?? ''}`.trim();
    section.id = panel.sectionId || `top-panel-${index + 1}`;

    const header = document.createElement('div');
    header.className = 'panel-header';

    const title = document.createElement('span');
    title.className = 'panel-title';
    title.textContent = panel.panelTitle || `TOP_PANEL_${index + 1}`;

    const uid = document.createElement('span');
    uid.className = 'panel-uid';
    uid.textContent = panel.panelUid || `ID: TOP-${String(index + 1).padStart(2, '0')}`;

    header.append(title, uid);

    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-container';
    const mermaidContainer = document.createElement('div');
    mermaidContainer.className = 'mermaid';
    mermaidContainer.setAttribute('data-mermaid-id', panel.diagramId || '');
    graphContainer.appendChild(mermaidContainer);

    const metrics = document.createElement('div');
    metrics.className = 'hero-message';
    renderMetricLines(metrics, panel.metrics, '> Add metrics in templateConfig.topPanels');

    section.append(header, graphContainer, metrics);
    return section;
}

function renderTopPanels() {
    const container = byId('top-panels');
    if (!container) {
        return;
    }
    container.replaceChildren();

    const panels = Array.isArray(templateConfig.topPanels) ? templateConfig.topPanels : [];
    panels.forEach((panel, index) => {
        container.appendChild(createTopPanel(panel, index));
    });
}

function renderSkills() {
    const skillsConfig = templateConfig.skills ?? {};
    const section = byId('skill-set');
    const grid = byId('skill-grid');
    if (!grid) {
        return;
    }

    if (section && skillsConfig.sectionId) {
        section.id = skillsConfig.sectionId;
    }
    setText('skills-panel-title', skillsConfig.panelTitle);
    setText('skills-panel-uid', skillsConfig.panelUid);

    grid.replaceChildren();
    const items = Array.isArray(skillsConfig.items) ? skillsConfig.items : [];

    items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'skill-card';

        const title = document.createElement('h3');
        title.className = 'skill-card-title';
        title.textContent = item.title ?? 'CATEGORY';

        const stack = document.createElement('p');
        stack.className = 'skill-card-stack';
        stack.textContent = item.stack ?? '';

        card.append(title, stack);
        grid.appendChild(card);
    });
}

function createGroupDivider(group, sectionTheme) {
    const divider = document.createElement('div');
    divider.className = 'group-divider';
    divider.setAttribute('data-theme', sectionTheme || 'blue');

    const title = document.createElement('span');
    title.className = 'group-title';
    title.textContent = group.title ?? '';

    const desc = document.createElement('span');
    desc.className = 'group-desc';
    desc.textContent = group.desc ?? '';

    divider.append(title, desc);
    return divider;
}

function createMetaLine(label, value) {
    if (!value) {
        return null;
    }

    const line = document.createElement('p');
    line.className = 'card-meta-line';

    const key = document.createElement('span');
    key.className = 'meta-label';
    key.textContent = `${label}:`;

    const text = document.createElement('span');
    text.className = 'meta-value';
    text.textContent = value;

    line.append(key, text);
    return line;
}

function createNarrativeBlock(label, content, tone) {
    if (!content) {
        return null;
    }

    const block = document.createElement('section');
    block.className = `card-narrative ${tone ? `is-${tone}` : ''}`.trim();

    const heading = document.createElement('h4');
    heading.className = 'card-narrative-title';
    heading.textContent = label;

    const body = document.createElement('p');
    body.className = 'card-narrative-body';
    body.textContent = content;

    block.append(heading, body);
    return block;
}

function extractFirstLineSummary(content) {
    if (!content) {
        return '';
    }

    const lines = String(content)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    for (const line of lines) {
        const cleaned = line
            .replace(/^\d+\)\s*/, '')
            .replace(/^[-*]\s*/, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (cleaned) {
            return cleaned;
        }
    }

    return '';
}

function createScanSummary(card) {
    const rows = [
        { label: 'PROBLEM', value: extractFirstLineSummary(card.problem || card.cause) },
        { label: 'ACTION', value: extractFirstLineSummary(card.solution) },
        { label: 'IMPACT', value: extractFirstLineSummary(card.result) }
    ].filter((item) => item.value);

    if (rows.length === 0) {
        return null;
    }

    const wrapper = document.createElement('section');
    wrapper.className = 'card-scan-summary';

    rows.forEach((item) => {
        const line = document.createElement('p');
        line.className = 'card-scan-row';

        const key = document.createElement('span');
        key.className = 'card-scan-key';
        key.textContent = item.label;

        const value = document.createElement('span');
        value.className = 'card-scan-value';
        value.textContent = item.value;

        line.append(key, value);
        wrapper.appendChild(line);
    });

    return wrapper;
}

function createRecruiterCardSummary(card) {
    const explicitLines = Array.isArray(card?.recruiterSummary)
        ? card.recruiterSummary.map((line) => String(line || '').trim()).filter(Boolean)
        : [];

    const fallbackLines = [
        extractFirstLineSummary(card?.overview || card?.description),
        extractFirstLineSummary(card?.result)
    ].filter(Boolean);

    const lines = (explicitLines.length > 0 ? explicitLines : fallbackLines).slice(0, 3);
    if (lines.length === 0) {
        return null;
    }

    const wrapper = document.createElement('section');
    wrapper.className = 'card-recruiter-summary';

    const kicker = document.createElement('p');
    kicker.className = 'card-recruiter-kicker';
    kicker.textContent = 'RECRUITER_SUMMARY';

    const list = document.createElement('ul');
    list.className = 'card-recruiter-list';
    lines.forEach((line) => {
        const item = document.createElement('li');
        item.textContent = line;
        list.appendChild(item);
    });

    wrapper.append(kicker, list);
    return wrapper;
}

function createSectionRecruiterBrief(sectionConfig) {
    const brief = sectionConfig?.recruiterBrief;
    if (!brief || typeof brief !== 'object') {
        return null;
    }

    const quickCases = Array.isArray(brief.cases)
        ? brief.cases
            .map((item) => ({
                id: String(item?.id || '').trim(),
                anchorId: String(item?.anchorId || '').trim(),
                title: String(item?.title || '').trim(),
                problem: String(item?.problem || '').trim(),
                action: String(item?.action || '').trim(),
                impact: String(item?.impact || '').trim()
            }))
            .filter((item) => item.id || item.title || item.problem || item.action || item.impact)
        : [];

    const bullets = Array.isArray(brief.bullets)
        ? brief.bullets.map((line) => String(line || '').trim()).filter(Boolean)
        : [];

    if (!brief.title && bullets.length === 0 && quickCases.length === 0) {
        return null;
    }

    const wrapper = document.createElement('section');
    wrapper.className = 'section-recruiter-brief';

    const kickerText = String(brief.kicker || '').trim();
    if (kickerText) {
        const kicker = document.createElement('p');
        kicker.className = 'section-recruiter-kicker';
        kicker.textContent = kickerText;
        wrapper.appendChild(kicker);
    }

    const titleText = String(brief.title || '').trim();
    if (titleText) {
        const title = document.createElement('h3');
        title.className = 'section-recruiter-title';
        title.textContent = titleText;
        wrapper.appendChild(title);
    }

    if (quickCases.length > 0) {
        const cardGrid = document.createElement('div');
        cardGrid.className = 'section-recruiter-card-grid';

        quickCases.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'section-recruiter-card';
            if (item.anchorId) {
                card.setAttribute('data-anchor-id', item.anchorId);
            }

            const idLine = document.createElement('p');
            idLine.className = 'section-recruiter-card-id';
            idLine.textContent = item.id || 'Case';

            const cardTitle = document.createElement('h4');
            cardTitle.className = 'section-recruiter-card-title';
            cardTitle.textContent = item.title || '핵심 변화';

            const createRow = (labelText, valueText) => {
                if (!valueText) {
                    return null;
                }
                const row = document.createElement('p');
                row.className = 'section-recruiter-card-row';

                const label = document.createElement('span');
                label.className = 'section-recruiter-card-key';
                label.textContent = `${labelText}:`;

                const value = document.createElement('span');
                value.className = 'section-recruiter-card-value';
                value.textContent = valueText;

                row.append(label, value);
                return row;
            };

            const problemRow = createRow('PROBLEM', item.problem);
            const actionRow = createRow('ACTION', item.action);
            const impactRow = createRow('IMPACT', item.impact);

            card.append(idLine, cardTitle);
            if (problemRow) {
                card.appendChild(problemRow);
            }
            if (actionRow) {
                card.appendChild(actionRow);
            }
            if (impactRow) {
                card.appendChild(impactRow);
            }
            cardGrid.appendChild(card);
        });

        wrapper.appendChild(cardGrid);
    }

    if (bullets.length > 0 && quickCases.length === 0) {
        const list = document.createElement('ul');
        list.className = 'section-recruiter-list';
        bullets.forEach((line) => {
            const item = document.createElement('li');
            item.textContent = line;
            list.appendChild(item);
        });
        wrapper.appendChild(list);
    }

    const actions = document.createElement('div');
    actions.className = 'section-recruiter-actions';
    wrapper.appendChild(actions);

    return wrapper;
}

function createTagList(tags) {
    const normalizedTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    if (normalizedTags.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-tags';

    normalizedTags.forEach((tag) => {
        const item = document.createElement('span');
        item.className = 'card-tag';
        item.textContent = tag;
        wrapper.appendChild(item);
    });

    return wrapper;
}

function createHighlightList(items) {
    const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];
    if (normalizedItems.length === 0) {
        return null;
    }

    const list = document.createElement('ul');
    list.className = 'card-highlights';
    normalizedItems.forEach((item) => {
        const line = document.createElement('li');
        line.textContent = item;
        list.appendChild(line);
    });
    return list;
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

function buildEvidencePairKey(item) {
    const explicitKey = String(item?.pairKey || '').trim().toLowerCase();
    if (explicitKey) {
        return explicitKey;
    }

    const normalizedLabel = String(item?.label || '')
        .toLowerCase()
        .replace(/\bbefore\b|\bafter\b/g, ' ')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (normalizedLabel) {
        return normalizedLabel;
    }

    return String(item?.src || '')
        .toLowerCase()
        .replace(/\bbefore\b|\bafter\b/g, ' ')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
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
    grouped.forEach((bucket) => {
        const leftItems = [...bucket.before, ...bucket.other];
        const rightItems = bucket.after;
        const pairCount = Math.max(leftItems.length, rightItems.length);

        for (let index = 0; index < pairCount; index += 1) {
            pairs.push({
                before: leftItems[index] || null,
                after: rightItems[index] || null
            });
        }
    });

    return pairs;
}

function toPairSuffix(index) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let value = index;
    let output = '';
    do {
        output = alphabet[value % 26] + output;
        value = Math.floor(value / 26) - 1;
    } while (value >= 0);
    return output;
}

function normalizeEvidenceItems(items) {
    const normalizedItems = Array.isArray(items)
        ? items.filter((item) => item?.src).map((item) => ({
            src: item.src,
            label: item.label || 'EVIDENCE',
            alt: item.alt || item.label || 'evidence image',
            phase: ['before', 'after', 'other'].includes(String(item.phase || '').toLowerCase())
                ? String(item.phase).toLowerCase()
                : detectEvidencePhase(item),
            pairKey: item.pairKey || '',
            missingBeforeReason: item.missingBeforeReason || '',
            missingAfterReason: item.missingAfterReason || ''
        }))
        : [];
    return normalizedItems;
}

function createEvidenceGallery(items, caseTitle) {
    const normalizedItems = normalizeEvidenceItems(items);
    if (normalizedItems.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-evidence';

    const title = document.createElement('h4');
    title.className = 'card-evidence-title';
    title.textContent = 'PERFORMANCE_EVIDENCE (k6)';

    const grid = document.createElement('div');
    grid.className = 'card-evidence-grid';

    normalizedItems.forEach((item) => {
        const trigger = document.createElement('button');
        trigger.className = 'card-evidence-item';
        trigger.type = 'button';
        trigger.setAttribute('aria-label', `${caseTitle || 'case'} performance evidence ${item.label}`);

        const image = document.createElement('img');
        image.src = item.src;
        image.alt = item.alt;
        image.loading = 'lazy';

        const caption = document.createElement('span');
        caption.className = 'card-evidence-caption';
        caption.textContent = item.label || 'EVIDENCE';

        trigger.append(image, caption);
        trigger.addEventListener('click', () => {
            if (typeof openExtraEvidenceModal === 'function') {
                openExtraEvidenceModal(
                    normalizedItems,
                    `${caseTitle || 'Case'} · PERFORMANCE_EVIDENCE`,
                    {
                        initialSrc: item.src,
                        source: 'performance_evidence_grid',
                        caseId: caseTitle || 'unknown_case'
                    }
                );
            } else {
                window.open(item.src, '_blank', 'noopener,noreferrer');
            }

            trackSelectContent({
                contentType: 'performance_evidence',
                itemId: caseTitle || 'unknown_case',
                itemName: item.label || 'unknown_evidence',
                sectionName: 'case_card',
                interactionAction: 'click_thumbnail',
                elementType: 'button',
                elementLabel: item.label || 'unknown_evidence',
                modalName: 'extra_evidence_modal',
                evidence_phase: item.phase || 'unknown'
            });
        });
        grid.appendChild(trigger);
    });

    wrapper.append(title, grid);
    return wrapper;
}

let openExtraEvidenceModal = null;

function createExtraEvidenceButton(items, caseTitle) {
    const normalizedItems = normalizeEvidenceItems(items);
    if (normalizedItems.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-extra-actions';

    const button = document.createElement('button');
    button.className = 'card-extra-btn';
    button.type = 'button';
    button.textContent = `EXTRA_IMAGES (${normalizedItems.length})`;
    button.setAttribute('aria-label', `${caseTitle || 'case'} extra evidence images`);

    button.addEventListener('click', () => {
        if (typeof openExtraEvidenceModal === 'function') {
            openExtraEvidenceModal(
                normalizedItems,
                `${caseTitle || 'Extra Images'} · EXTRA_IMAGES`,
                {
                    source: 'extra_images_button',
                    caseId: caseTitle || 'unknown_case'
                }
            );
        }

        trackSelectContent({
            contentType: 'extra_evidence_button',
            itemId: caseTitle || 'unknown_case',
            sectionName: 'case_card',
            interactionAction: 'click',
            elementType: 'button',
            elementLabel: 'EXTRA_IMAGES',
            modalName: 'extra_evidence_modal',
            value: normalizedItems.length
        });
    });

    wrapper.appendChild(button);
    return wrapper;
}

function createCardLinks(card) {
    const links = Array.isArray(card.links) ? card.links.filter((item) => item?.href) : [];
    if (links.length === 0 && card.learnMore && card.learnMore !== '#') {
        links.push({ label: card.linkLabel ?? 'LEARN MORE', href: card.learnMore });
    }

    if (links.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-links';

    links.forEach((item) => {
        const originalHref = String(item.href || '');
        const resolvedHref = toCaseReviewLink(originalHref);
        const isCaseReviewLink = resolvedHref !== originalHref;
        const link = document.createElement('a');
        link.className = 'card-link';
        if (isCaseReviewLink) {
            link.classList.add('case-review-link');
        }
        link.href = resolvedHref;
        link.textContent = isCaseReviewLink ? 'CASE_REVIEW' : (item.label || 'LINK');
        if (!String(resolvedHref).startsWith('mailto:')) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }

        // GA4 Event Tracking
        link.addEventListener('click', () => {
            trackSelectContent({
                contentType: 'case_link',
                itemId: card.title || 'unknown_case',
                itemName: item.label || 'LINK',
                sectionName: 'case_card',
                interactionAction: 'open_link',
                elementType: 'link',
                elementLabel: isCaseReviewLink ? 'CASE_REVIEW' : (item.label || 'LINK'),
                linkUrl: resolvedHref,
                linkType: detectLinkType(resolvedHref),
                source_link_url: isCaseReviewLink ? originalHref : ''
            });
        });

        wrapper.appendChild(link);
    });

    return wrapper;
}

function createServiceCard(card, sectionConfig) {
    const article = document.createElement('article');
    article.className = `service-card ${sectionConfig.cardClass ?? ''} ${card.cardClass ?? ''}`.trim();
    if (card.anchorId) {
        article.id = card.anchorId;
    }

    const visual = document.createElement('div');
    visual.className = 'card-visual';
    const visualHeight = card.visualHeight || sectionConfig.cardVisualHeight;
    if (visualHeight) {
        visual.style.setProperty('--card-visual-height', visualHeight);
    }

    const mermaidContainer = document.createElement('div');
    mermaidContainer.className = 'mermaid';
    mermaidContainer.setAttribute('data-mermaid-id', card.mermaidId ?? '');
    visual.appendChild(mermaidContainer);

    const content = document.createElement('div');
    content.className = 'card-content';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = card.title ?? 'Card Title';

    const subtitleText = card.subtitle ?? card.period ?? '';
    const subtitle = document.createElement('p');
    subtitle.className = 'card-subtitle';
    subtitle.textContent = subtitleText;

    const description = document.createElement('p');
    description.className = 'card-desc';
    const overviewText = card.overview ?? card.description ?? '';
    description.textContent = extractFirstLineSummary(overviewText) || overviewText;

    const recruiterSummary = createRecruiterCardSummary(card);
    const stackLine = createMetaLine('TECH_DETAIL', card.stackSummary);
    const scanSummary = createScanSummary(card);
    const evidenceGallery = createEvidenceGallery(card.evidenceImages, card.title);
    const extraEvidenceButton = createExtraEvidenceButton(card.extraEvidenceImages, card.title);
    const links = createCardLinks(card);

    content.append(title);
    if (subtitleText) {
        content.append(subtitle);
    }
    content.append(description);
    if (recruiterSummary) {
        content.append(recruiterSummary);
    }
    if (stackLine) {
        content.append(stackLine);
    }
    if (scanSummary) {
        content.append(scanSummary);
    }
    if (evidenceGallery) {
        content.append(evidenceGallery);
    }
    if (extraEvidenceButton) {
        content.append(extraEvidenceButton);
    }
    if (links) {
        content.append(links);
    }
    article.append(visual, content);
    return article;
}

function renderServiceSections() {
    const container = byId('service-sections');
    if (!container) {
        return;
    }
    container.replaceChildren();
    caseShowcaseControllers = [];

    const sections = Array.isArray(templateConfig.serviceSections) ? templateConfig.serviceSections : [];
    sections.forEach((sectionConfig) => {
        const sectionWrapper = document.createElement('section');
        sectionWrapper.className = 'service-section';
        sectionWrapper.id = sectionConfig.id ?? '';

        const header = document.createElement('div');
        header.className = 'section-header';

        const headingWrap = document.createElement('div');
        headingWrap.className = 'section-header-main';

        const heading = document.createElement('h2');
        heading.className = 'section-title';
        heading.textContent = sectionConfig.title ?? 'SERVICES';
        headingWrap.appendChild(heading);

        const sectionLeadText = String(sectionConfig.sectionLead || '').trim();
        if (sectionLeadText) {
            const sectionLead = document.createElement('p');
            sectionLead.className = 'section-lead';
            sectionLead.textContent = sectionLeadText;
            headingWrap.appendChild(sectionLead);
        }
        header.appendChild(headingWrap);

        const groupsContainer = document.createElement('div');
        groupsContainer.className = 'service-groups';
        const recruiterBrief = createSectionRecruiterBrief(sectionConfig);
        const renderedCards = [];
        const groupCardMap = new Map();
        const recruiterCaseCards = recruiterBrief
            ? Array.from(recruiterBrief.querySelectorAll('.section-recruiter-card'))
            : [];

        const groups = Array.isArray(sectionConfig.groups) && sectionConfig.groups.length > 0
            ? sectionConfig.groups
            : [{ title: '', desc: '', cards: sectionConfig.cards ?? [] }];

        groups.forEach((group) => {
            const groupSection = document.createElement('div');
            groupSection.className = 'service-group';

            if (group.title || group.desc) {
                groupSection.appendChild(createGroupDivider(group, sectionConfig.theme));
            }

            const groupGrid = document.createElement('div');
            groupGrid.className = 'service-grid';

            const cards = Array.isArray(group.cards) ? group.cards : [];
            cards.forEach((card) => {
                const cardElement = createServiceCard(card, sectionConfig);
                groupGrid.appendChild(cardElement);

                const anchorId = String(card?.anchorId || cardElement.id || '').trim();
                renderedCards.push({ anchorId, element: cardElement, groupSection });

                if (!groupCardMap.has(groupSection)) {
                    groupCardMap.set(groupSection, []);
                }
                groupCardMap.get(groupSection).push(cardElement);
            });

            groupSection.appendChild(groupGrid);
            groupsContainer.appendChild(groupSection);
        });

        const configuredFeaturedAnchors = Array.isArray(sectionConfig.featuredCaseAnchors)
            ? sectionConfig.featuredCaseAnchors
                .map((anchorId) => String(anchorId || '').trim())
                .filter(Boolean)
            : [];
        const featuredCountCandidate = Number.parseInt(sectionConfig.featuredCaseCount, 10);
        const featuredCount = Number.isFinite(featuredCountCandidate) && featuredCountCandidate > 0
            ? featuredCountCandidate
            : 3;
        let featuredAnchors = configuredFeaturedAnchors.filter((anchorId) =>
            renderedCards.some((entry) => entry.anchorId === anchorId)
        );
        if (featuredAnchors.length === 0) {
            featuredAnchors = renderedCards
                .slice(0, featuredCount)
                .map((entry) => entry.anchorId)
                .filter(Boolean);
        }

        const featuredSet = new Set(featuredAnchors);
        const allAnchorSet = new Set(renderedCards.map((entry) => entry.anchorId).filter(Boolean));
        const canCollapse = featuredSet.size > 0 && featuredSet.size < renderedCards.length;

        if (canCollapse) {
            const controls = document.createElement('div');
            controls.className = 'case-showcase-controls';

            const stateLabel = String(
                sectionConfig.featuredStateLabel || `대표 ${featuredSet.size}건 우선 노출`
            ).trim();
            const expandLabel = String(
                sectionConfig.featuredToggleLabel || `전체 Case ${renderedCards.length}건 보기`
            ).trim();
            const collapseLabel = String(
                sectionConfig.featuredCollapseLabel || `대표 Case ${featuredSet.size}건만 보기`
            ).trim();

            const state = document.createElement('span');
            state.className = 'case-showcase-state';

            const toggleButton = document.createElement('button');
            toggleButton.type = 'button';
            toggleButton.className = 'case-showcase-toggle';
            toggleButton.setAttribute('aria-expanded', 'false');

            let isCollapsed = true;

            const applyVisibility = () => {
                const newlyVisibleEntries = [];
                renderedCards.forEach((entry) => {
                    const wasHidden = entry.element.hidden;
                    const isVisible = !isCollapsed || featuredSet.has(entry.anchorId);
                    entry.element.hidden = !isVisible;
                    entry.element.classList.toggle('is-collapsed-hidden', !isVisible);
                    if (wasHidden && isVisible) {
                        newlyVisibleEntries.push(entry);
                    }
                });

                groupCardMap.forEach((cardNodes, groupSection) => {
                    const hasVisibleCard = cardNodes.some((cardNode) => !cardNode.hidden);
                    groupSection.hidden = !hasVisibleCard;
                    groupSection.classList.toggle('is-collapsed-empty', !hasVisibleCard);
                });

                if (recruiterCaseCards.length > 0) {
                    recruiterCaseCards.forEach((cardNode) => {
                        const anchorId = String(cardNode.getAttribute('data-anchor-id') || '').trim();
                        const isVisible = !isCollapsed || !anchorId || featuredSet.has(anchorId);
                        cardNode.hidden = !isVisible;
                        cardNode.classList.toggle('is-collapsed-hidden', !isVisible);
                    });
                }

                sectionWrapper.classList.toggle('is-featured-collapsed', isCollapsed);
                const hiddenCount = Math.max(0, renderedCards.length - featuredSet.size);
                state.textContent = isCollapsed
                    ? `${stateLabel} · 현재 ${featuredSet.size}/${renderedCards.length}건 표시 (숨김 ${hiddenCount}건)`
                    : `현재 전체 ${renderedCards.length}/${renderedCards.length}건 표시`;
                toggleButton.textContent = isCollapsed ? expandLabel : collapseLabel;
                toggleButton.setAttribute('aria-expanded', String(!isCollapsed));
                if (!isCollapsed) {
                    rerenderVisibleCardDiagrams(
                        newlyVisibleEntries.length > 0 ? newlyVisibleEntries : renderedCards,
                        { force: true }
                    );
                }
                window.dispatchEvent(new Event('resize'));
            };

            const setCollapsed = (nextCollapsed, triggerSource = 'toggle') => {
                if (isCollapsed === nextCollapsed) {
                    return false;
                }

                isCollapsed = nextCollapsed;
                applyVisibility();

                trackSelectContent({
                    contentType: 'case_showcase_toggle',
                    itemId: sectionConfig.id || 'service_cases',
                    itemName: sectionConfig.title || 'CASES',
                    sectionName: 'service_section',
                    interactionAction: isCollapsed ? 'collapse' : 'expand',
                    elementType: 'button',
                    elementLabel: 'CASE_SHOWCASE_TOGGLE',
                    value: renderedCards.length,
                    trigger_source: triggerSource,
                    hidden_count: isCollapsed ? Math.max(0, renderedCards.length - featuredSet.size) : 0,
                    visible_count: isCollapsed ? featuredSet.size : renderedCards.length
                });
                return true;
            };

            toggleButton.addEventListener('click', () => {
                setCollapsed(!isCollapsed, 'toggle_button');
            });

            controls.append(state, toggleButton);
            const recruiterActionMount = recruiterBrief?.querySelector('.section-recruiter-actions');
            if (recruiterActionMount instanceof HTMLElement) {
                recruiterActionMount.appendChild(controls);
            } else {
                header.appendChild(controls);
            }
            applyVisibility();

            caseShowcaseControllers.push({
                sectionId: sectionConfig.id || '',
                revealCase(anchorId, triggerSource = 'target_reveal') {
                    if (!anchorId || !allAnchorSet.has(anchorId) || !isCollapsed || featuredSet.has(anchorId)) {
                        return false;
                    }
                    return setCollapsed(false, triggerSource);
                }
            });
        }

        sectionWrapper.append(header);
        if (recruiterBrief) {
            sectionWrapper.appendChild(recruiterBrief);
        }
        sectionWrapper.appendChild(groupsContainer);
        container.appendChild(sectionWrapper);
    });
}

function ensureCaseCardVisible(targetId) {
    const anchorId = String(targetId || '').replace(/^#/, '').trim();
    if (!anchorId || caseShowcaseControllers.length === 0) {
        return false;
    }

    let revealed = false;
    caseShowcaseControllers.forEach((controller) => {
        if (!controller || typeof controller.revealCase !== 'function') {
            return;
        }
        if (controller.revealCase(anchorId, 'anchor_navigation')) {
            revealed = true;
        }
    });
    return revealed;
}

function renderContact() {
    const contact = templateConfig.contact ?? {};
    const section = byId('contact');
    const actions = byId('contact-actions');

    if (section && contact.sectionId) {
        section.id = contact.sectionId;
    }
    setText('contact-panel-title', contact.panelTitle);
    setText('contact-panel-uid', contact.panelUid);
    setText('contact-description', contact.description);

    if (!actions) {
        return;
    }
    actions.replaceChildren();

    const items = Array.isArray(contact.actions) ? contact.actions : [];
    items.forEach((item) => {
        const action = document.createElement('a');
        action.className = 'action-btn';
        action.href = item.href || '#';
        action.textContent = item.label || 'LINK';
        const actionHref = item.href || '#';
        if (!String(item.href || '').startsWith('mailto:')) {
            action.target = '_blank';
            action.rel = 'noopener noreferrer';
        }

        action.addEventListener('click', () => {
            trackSelectContent({
                contentType: 'contact_action',
                itemId: item.label || 'unknown_contact_action',
                itemName: item.label || 'LINK',
                sectionName: 'contact',
                interactionAction: 'open_link',
                elementType: 'link',
                elementLabel: item.label || 'LINK',
                linkUrl: actionHref,
                linkType: detectLinkType(actionHref)
            });
        });
        actions.appendChild(action);
    });
}

function buildDefaultNavigation() {
    const items = [];

    const hero = templateConfig.hero ?? {};
    const skills = templateConfig.skills ?? {};
    const contact = templateConfig.contact ?? {};

    items.push({
        label: hero.panelTitle || 'SYSTEM_ARCHITECTURE',
        target: normalizeHashTarget(hero.sectionId || 'system-architecture')
    });

    const topPanels = Array.isArray(templateConfig.topPanels) ? templateConfig.topPanels : [];
    topPanels.forEach((panel, index) => {
        items.push({
            label: panel.navLabel || panel.panelTitle || `TOP_PANEL_${index + 1}`,
            target: normalizeHashTarget(panel.sectionId || `top-panel-${index + 1}`)
        });
    });

    items.push({
        label: skills.panelTitle || 'SKILL_SET',
        target: normalizeHashTarget(skills.sectionId || 'skill-set')
    });

    const serviceSections = Array.isArray(templateConfig.serviceSections) ? templateConfig.serviceSections : [];
    serviceSections.forEach((section) => {
        items.push({
            label: section.navLabel || section.title || section.id || 'SERVICES',
            target: normalizeHashTarget(section.id || '')
        });
    });

    items.push({
        label: contact.panelTitle || 'CONTACT',
        target: normalizeHashTarget(contact.sectionId || 'contact')
    });

    return items;
}

function buildCaseNavigationItems(casesTarget) {
    const normalizedCasesTarget = normalizeHashTarget(casesTarget || 'cases');
    const sections = Array.isArray(templateConfig.serviceSections) ? templateConfig.serviceSections : [];
    const casesSection = sections.find((section) => normalizeHashTarget(section.id || '') === normalizedCasesTarget);
    if (!casesSection) {
        return [];
    }

    const groups = Array.isArray(casesSection.groups) && casesSection.groups.length > 0
        ? casesSection.groups
        : [{ cards: casesSection.cards ?? [] }];

    const caseItems = [];
    let sequence = 1;
    groups.forEach((group) => {
        const cards = Array.isArray(group.cards) ? group.cards : [];
        cards.forEach((card) => {
            if (!card?.title) {
                return;
            }
            const anchorId = String(card.anchorId || '').trim();
            if (!anchorId) {
                return;
            }
            caseItems.push({
                label: card.title || `Case ${sequence}`,
                target: normalizeHashTarget(anchorId)
            });
            sequence += 1;
        });
    });

    return caseItems;
}

function renderNavigation() {
    const nav = byId('header-nav');
    if (!nav) {
        return;
    }
    nav.replaceChildren();

    const configuredNav = Array.isArray(templateConfig.navigation) && templateConfig.navigation.length > 0
        ? templateConfig.navigation
        : buildDefaultNavigation();

    configuredNav.forEach((item) => {
        const normalizedTarget = normalizeHashTarget(item.target);
        const label = String(item.label || '');
        const isCasesMenu = Boolean(item.caseMenu) || label.toUpperCase().includes('CASE');
        const caseItems = isCasesMenu ? buildCaseNavigationItems(normalizedTarget) : [];
        if (caseItems.length > 0) {
            const wrap = document.createElement('div');
            wrap.className = 'nav-item-wrap has-submenu';

            const parent = document.createElement('a');
            parent.className = 'nav-item nav-parent';
            parent.href = normalizedTarget;
            parent.textContent = item.label || 'CASES';
            parent.addEventListener('click', () => {
                trackSelectContent({
                    contentType: 'navigation',
                    itemId: normalizedTarget.replace(/^#/, '') || 'unknown_target',
                    itemName: parent.textContent || 'CASES',
                    sectionName: 'header_nav',
                    interactionAction: 'navigate',
                    elementType: 'nav_link',
                    elementLabel: parent.textContent || 'CASES',
                    linkUrl: normalizedTarget,
                    linkType: detectLinkType(normalizedTarget)
                });
            });
            wrap.appendChild(parent);

            const submenu = document.createElement('div');
            submenu.className = 'nav-submenu';
            caseItems.forEach((caseItem) => {
                const subLink = document.createElement('a');
                subLink.className = 'nav-sub-item';
                subLink.href = normalizeHashTarget(caseItem.target);
                subLink.textContent = caseItem.label || 'CASE';
                subLink.addEventListener('click', () => {
                    const target = normalizeHashTarget(caseItem.target);
                    const targetId = target.replace(/^#/, '');
                    ensureCaseCardVisible(targetId);
                    trackSelectContent({
                        contentType: 'navigation_case',
                        itemId: targetId || 'unknown_case_target',
                        itemName: caseItem.label || 'CASE',
                        sectionName: 'header_nav',
                        interactionAction: 'navigate',
                        elementType: 'nav_sub_link',
                        elementLabel: caseItem.label || 'CASE',
                        linkUrl: target,
                        linkType: detectLinkType(target)
                    });
                });
                submenu.appendChild(subLink);
            });

            wrap.append(submenu);
            nav.appendChild(wrap);
            return;
        }

        const link = document.createElement('a');
        link.className = 'nav-item';
        link.href = normalizedTarget;
        link.textContent = item.label || 'SECTION';
        link.addEventListener('click', () => {
            trackSelectContent({
                contentType: 'navigation',
                itemId: normalizedTarget.replace(/^#/, '') || 'unknown_target',
                itemName: item.label || 'SECTION',
                sectionName: 'header_nav',
                interactionAction: 'navigate',
                elementType: 'nav_link',
                elementLabel: item.label || 'SECTION',
                linkUrl: normalizedTarget,
                linkType: detectLinkType(normalizedTarget)
            });
        });
        nav.appendChild(link);
    });
}

function setupScrollSpy() {
    const nav = byId('header-nav');
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
        const targetElement = byId(targetId);
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

function setupK6OverviewModal() {
    const modal = byId('k6-overview-modal');
    const modalContent = byId('k6-overview-content');
    const modalTitle = byId('k6-overview-title');

    if (!modal || !modalContent || !modalTitle) {
        return;
    }

    let activeLabel = 'K6_TEST_ENVIRONMENT';

    const durationToSeconds = (durationToken) => {
        const text = String(durationToken || '').trim().toLowerCase();
        const match = text.match(/^(\d+)\s*([smhd])$/);
        if (!match) {
            return 0;
        }

        const amount = Number.parseInt(match[1], 10);
        if (!Number.isFinite(amount) || amount <= 0) {
            return 0;
        }

        const unit = match[2];
        if (unit === 's') {
            return amount;
        }
        if (unit === 'm') {
            return amount * 60;
        }
        if (unit === 'h') {
            return amount * 3600;
        }
        if (unit === 'd') {
            return amount * 86400;
        }
        return 0;
    };

    const formatDuration = (totalSeconds) => {
        const seconds = Math.max(0, Math.floor(totalSeconds));
        if (seconds <= 0) {
            return 'N/A';
        }

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${remainSeconds}s`;
        }
        return `${minutes}m ${remainSeconds}s`;
    };

    const createListCard = (titleText, items, ordered = false) => {
        const card = document.createElement('article');
        card.className = 'k6-overview-card';

        const title = document.createElement('h3');
        title.className = 'k6-overview-card-title';
        title.textContent = titleText;
        card.appendChild(title);

        const list = document.createElement(ordered ? 'ol' : 'ul');
        list.className = 'k6-overview-list';
        items.forEach((line) => {
            const item = document.createElement('li');
            item.textContent = String(line);
            list.appendChild(item);
        });
        card.appendChild(list);

        return card;
    };

    const createSummaryItem = (labelText, valueText) => {
        const item = document.createElement('article');
        item.className = 'k6-overview-summary-item';

        const label = document.createElement('p');
        label.className = 'k6-overview-summary-label';
        label.textContent = labelText;

        const value = document.createElement('p');
        value.className = 'k6-overview-summary-value';
        value.textContent = valueText;

        item.append(label, value);
        return item;
    };

    const closeModal = () => {
        const wasOpen = modal.classList.contains('is-open');
        const closingTitle = modalTitle.textContent || 'K6_TEST_ENVIRONMENT_OVERVIEW';
        const modalDurationMs = analyticsSession.k6OverviewModalOpenedAt
            ? Math.max(0, Date.now() - analyticsSession.k6OverviewModalOpenedAt)
            : 0;

        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        modalContent.replaceChildren();
        analyticsSession.k6OverviewModalOpenedAt = 0;
        syncModalBodyLock();

        if (wasOpen) {
            trackSelectContent({
                contentType: 'k6_overview',
                itemId: 'k6_test_environment',
                itemName: closingTitle,
                sectionName: 'k6_overview_modal',
                interactionAction: 'close_modal',
                elementType: 'modal',
                elementLabel: closingTitle,
                modalName: 'k6_overview_modal',
                duration_ms: modalDurationMs,
                value: Math.round(modalDurationMs / 1000)
            });
        }
    };

    const openModal = (overview, sourceLabel = 'K6_TEST_ENVIRONMENT') => {
        if (!overview || typeof overview !== 'object') {
            return;
        }

        const profile = String(overview.profile || '').trim();
        const totalDurationSeconds = profile
            .split(',')
            .map((stage) => stage.trim())
            .filter(Boolean)
            .reduce((sum, stage) => {
                const [durationToken] = stage.split('@');
                return sum + durationToSeconds(durationToken);
            }, 0);

        const hardwareRows = Array.isArray(overview.hardware) ? overview.hardware : [];
        const keyMetrics = Array.isArray(overview.keyMetrics) ? overview.keyMetrics : [];
        const measurementProtocol = Array.isArray(overview.measurementProtocol) ? overview.measurementProtocol : [];
        const resultInterpretation = Array.isArray(overview.resultInterpretation) ? overview.resultInterpretation : [];
        const dbRows = Array.isArray(overview.dbRowEstimation) ? overview.dbRowEstimation : [];
        const comparisons = Array.isArray(overview.comparisons) ? overview.comparisons : [];
        const links = Array.isArray(overview.links) ? overview.links.filter((item) => item?.href) : [];

        activeLabel = String(sourceLabel || 'K6_TEST_ENVIRONMENT').trim() || 'K6_TEST_ENVIRONMENT';
        analyticsSession.k6OverviewModalOpenedAt = Date.now();
        modalTitle.textContent = String(overview.modalTitle || '').trim() || 'K6_TEST_ENVIRONMENT_OVERVIEW';

        const layout = document.createElement('div');
        layout.className = 'k6-overview-layout';

        const summaryGrid = document.createElement('section');
        summaryGrid.className = 'k6-overview-summary-grid';
        summaryGrid.append(
            createSummaryItem('RAMPING_PROFILE', profile || 'N/A'),
            createSummaryItem('MAX_VU', overview.maxVu ? String(overview.maxVu) : 'N/A'),
            createSummaryItem('TEST_WINDOW', formatDuration(totalDurationSeconds))
        );
        layout.appendChild(summaryGrid);

        const cardsGrid = document.createElement('section');
        cardsGrid.className = 'k6-overview-cards-grid';

        if (hardwareRows.length > 0) {
            const hardwareLines = hardwareRows.map((item) => `${item.label || 'ITEM'}: ${item.value || 'N/A'}`);
            cardsGrid.appendChild(createListCard('HW / ENVIRONMENT', hardwareLines));
        }
        if (measurementProtocol.length > 0) {
            cardsGrid.appendChild(createListCard('MEASUREMENT_PROTOCOL', measurementProtocol, true));
        }
        if (resultInterpretation.length > 0) {
            cardsGrid.appendChild(createListCard('RESULT_INTERPRETATION', resultInterpretation));
        }
        if (keyMetrics.length > 0) {
            cardsGrid.appendChild(createListCard(overview.keyMetricsTitle || 'MEASURED_RESULT', keyMetrics));
        }
        if (dbRows.length > 0) {
            cardsGrid.appendChild(createListCard('DB_ROW_ESTIMATION', dbRows, true));
        }
        layout.appendChild(cardsGrid);

        if (comparisons.length > 0) {
            const compareSection = document.createElement('section');
            compareSection.className = 'k6-overview-comparisons';

            comparisons.forEach((comparison) => {
                const compareCard = document.createElement('article');
                compareCard.className = 'k6-overview-compare-card';

                const heading = document.createElement('h3');
                heading.className = 'k6-overview-compare-title';
                heading.textContent = comparison.title || 'K6_COMPARISON';
                compareCard.appendChild(heading);

                const body = document.createElement('div');
                body.className = 'k6-overview-compare-body';

                const openComparisonEvidenceModal = (phase, label, src, alt) => {
                    if (!src) {
                        return;
                    }

                    const comparisonId = String(comparison?.id || '').trim() || 'comparison';
                    const evidenceItems = [
                        {
                            src: comparison.beforeImage || '',
                            label: comparison.beforeLabel || 'BEFORE',
                            alt: comparison.beforeAlt || comparison.beforeLabel || 'k6 before result',
                            phase: 'before',
                            pairKey: comparisonId
                        },
                        {
                            src: comparison.currentImage || '',
                            label: comparison.currentLabel || 'CURRENT',
                            alt: comparison.currentAlt || comparison.currentLabel || 'k6 current result',
                            phase: 'after',
                            pairKey: comparisonId
                        }
                    ].filter((item) => item.src);

                    if (typeof openExtraEvidenceModal === 'function') {
                        openExtraEvidenceModal(
                            evidenceItems,
                            `${comparison.title || 'K6_COMPARISON'} · IMAGE_ZOOM`,
                            {
                                initialSrc: src,
                                source: 'k6_overview_compare',
                                caseId: `k6_overview_${comparisonId}`
                            }
                        );
                    } else {
                        window.open(src, '_blank', 'noopener,noreferrer');
                    }

                    trackSelectContent({
                        contentType: 'k6_overview_evidence',
                        itemId: `k6_overview_${comparisonId}`,
                        itemName: `${comparison.title || 'K6_COMPARISON'} ${label || ''}`.trim(),
                        sectionName: 'k6_overview_modal',
                        interactionAction: 'open_modal',
                        elementType: 'image',
                        elementLabel: label || phase || 'EVIDENCE',
                        modalName: 'extra_evidence_modal',
                        evidence_phase: phase === 'current' ? 'after' : phase,
                        linkUrl: src,
                        linkType: detectLinkType(src)
                    });
                };

                const createFigure = (phase, label, src, alt) => {
                    const figure = document.createElement('figure');
                    figure.className = `k6-overview-figure is-${phase}`;

                    const badge = document.createElement('span');
                    badge.className = `k6-overview-phase is-${phase}`;
                    badge.textContent = label;

                    const image = document.createElement('img');
                    image.src = src || '';
                    image.alt = alt || label;
                    image.loading = 'lazy';

                    const caption = document.createElement('figcaption');
                    caption.className = 'k6-overview-figure-caption';
                    caption.textContent = label;

                    figure.append(badge, image, caption);

                    if (src) {
                        figure.classList.add('is-clickable');
                        figure.setAttribute('role', 'button');
                        figure.setAttribute('tabindex', '0');
                        figure.setAttribute(
                            'aria-label',
                            `${comparison.title || 'k6 comparison'} ${label || phase} image zoom`
                        );
                        const openZoom = () => openComparisonEvidenceModal(phase, label, src, alt);
                        figure.addEventListener('click', openZoom);
                        figure.addEventListener('keydown', (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                openZoom();
                            }
                        });
                    }

                    return figure;
                };

                body.append(
                    createFigure('before', comparison.beforeLabel || 'BEFORE', comparison.beforeImage, comparison.beforeAlt),
                    createFigure('current', comparison.currentLabel || 'CURRENT', comparison.currentImage, comparison.currentAlt)
                );

                compareCard.appendChild(body);
                compareSection.appendChild(compareCard);
            });

            layout.appendChild(compareSection);
        }

        if (links.length > 0) {
            const linkRow = document.createElement('section');
            linkRow.className = 'k6-overview-links';

            links.forEach((item) => {
                const link = document.createElement('a');
                link.className = 'k6-overview-link';
                link.href = item.href;
                link.textContent = item.label || 'LINK';
                if (!String(item.href).startsWith('mailto:')) {
                    link.target = '_blank';
                    link.rel = 'noopener noreferrer';
                }
                link.addEventListener('click', () => {
                    trackSelectContent({
                        contentType: 'k6_overview_link',
                        itemId: 'k6_test_environment',
                        itemName: item.label || 'LINK',
                        sectionName: 'k6_overview_modal',
                        interactionAction: 'open_link',
                        elementType: 'link',
                        elementLabel: item.label || 'LINK',
                        linkUrl: item.href,
                        linkType: detectLinkType(item.href),
                        modalName: 'k6_overview_modal'
                    });
                });
                linkRow.appendChild(link);
            });

            layout.appendChild(linkRow);
        }

        modalContent.replaceChildren(layout);
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        syncModalBodyLock();

        trackSelectContent({
            contentType: 'k6_overview',
            itemId: 'k6_test_environment',
            itemName: modalTitle.textContent || 'K6_TEST_ENVIRONMENT_OVERVIEW',
            sectionName: 'hero',
            interactionAction: 'open_modal',
            elementType: 'modal',
            elementLabel: activeLabel,
            modalName: 'k6_overview_modal'
        });
    };

    modal.querySelectorAll('[data-k6-overview-close]').forEach((node) => {
        node.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
        if (!modal.classList.contains('is-open')) {
            return;
        }
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    openK6OverviewModal = openModal;
}

function setupExtraEvidenceModal() {
    const modal = byId('extra-evidence-modal');
    const modalContent = byId('extra-evidence-content');
    const modalTitle = byId('extra-evidence-title');

    if (!modal || !modalContent || !modalTitle) {
        return;
    }

    let activeCaseId = 'unknown_case';

    const closeModal = () => {
        const wasOpen = modal.classList.contains('is-open');
        const closingTitle = modalTitle.textContent || 'Extra Images';
        const modalDurationMs = analyticsSession.extraEvidenceModalOpenedAt
            ? Math.max(0, Date.now() - analyticsSession.extraEvidenceModalOpenedAt)
            : 0;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        modalContent.replaceChildren();
        syncModalBodyLock();
        analyticsSession.extraEvidenceModalOpenedAt = 0;

        if (wasOpen) {
            trackSelectContent({
                contentType: 'extra_evidence',
                itemId: activeCaseId,
                itemName: closingTitle,
                sectionName: 'extra_evidence_modal',
                interactionAction: 'close_modal',
                elementType: 'modal',
                elementLabel: closingTitle,
                modalName: 'extra_evidence_modal',
                duration_ms: modalDurationMs,
                value: Math.round(modalDurationMs / 1000)
            });
        }
        activeCaseId = 'unknown_case';
    };

    const openModal = (items, title, options = {}) => {
        const normalizedItems = normalizeEvidenceItems(items);
        if (normalizedItems.length === 0) {
            return;
        }

        const heading = String(title || '').trim();
        const source = String(options.source || 'unknown').trim();
        const caseId = String(options.caseId || 'unknown_case').trim();
        activeCaseId = caseId;
        analyticsSession.extraEvidenceModalOpenedAt = Date.now();
        modalTitle.textContent = heading
            ? heading
            : 'Extra Images · EXTRA_IMAGES';
        const phaseOrder = { before: 0, after: 1, other: 2 };
        const sortedItems = [...normalizedItems].sort((left, right) => {
            const phaseDiff = (phaseOrder[left.phase] ?? 9) - (phaseOrder[right.phase] ?? 9);
            if (phaseDiff !== 0) {
                return phaseDiff;
            }
            return left.label.localeCompare(right.label, 'ko');
        }).map((item, index) => ({ ...item, __index: index }));

        const evidencePairs = buildEvidencePairs(sortedItems);

        const layout = document.createElement('div');
        layout.className = 'extra-evidence-layout';

        const listPanel = document.createElement('section');
        listPanel.className = 'extra-evidence-list';

        const pairList = document.createElement('div');
        pairList.className = 'extra-evidence-pairs';

        const preview = document.createElement('section');
        preview.className = 'extra-evidence-preview';

        const previewImageWrap = document.createElement('div');
        previewImageWrap.className = 'extra-evidence-preview-image-wrap';

        const previewImage = document.createElement('img');
        previewImage.className = 'extra-evidence-preview-image';
        previewImage.loading = 'lazy';

        const previewCaption = document.createElement('p');
        previewCaption.className = 'extra-evidence-preview-caption';

        const previewActions = document.createElement('div');
        previewActions.className = 'extra-evidence-preview-actions';

        const zoomButton = document.createElement('button');
        zoomButton.className = 'extra-evidence-zoom-btn';
        zoomButton.type = 'button';
        zoomButton.textContent = 'ZOOM';

        const originalLink = document.createElement('a');
        originalLink.className = 'extra-evidence-open-original';
        originalLink.target = '_blank';
        originalLink.rel = 'noopener noreferrer';
        originalLink.textContent = 'OPEN_ORIGINAL';

        const initialSrc = String(options.initialSrc || '').trim();
        const initialIndex = Number.isInteger(options.initialIndex) ? options.initialIndex : 0;
        let activeIndex = Math.min(sortedItems.length - 1, Math.max(0, initialIndex));
        if (initialSrc) {
            const matchIndex = sortedItems.findIndex((item) => item.src === initialSrc);
            if (matchIndex >= 0) {
                activeIndex = matchIndex;
            }
        }
        let isZoomed = false;
        const thumbButtons = [];

        const setZoom = (nextZoom) => {
            isZoomed = nextZoom;
            previewImage.classList.toggle('is-zoomed', isZoomed);
            zoomButton.textContent = isZoomed ? 'RESET_ZOOM' : 'ZOOM';
        };

        const setActive = (index, shouldTrack = false) => {
            activeIndex = index;
            const activeItem = sortedItems[index];
            if (!activeItem) {
                return;
            }
            previewImage.src = activeItem.src;
            previewImage.alt = activeItem.alt;
            previewCaption.textContent = `[${activeItem.phase.toUpperCase()}] ${activeItem.label}`;
            originalLink.href = activeItem.src;
            setZoom(false);

            thumbButtons.forEach((button) => {
                const buttonIndex = Number(button.dataset.index || '-1');
                button.classList.toggle('is-active', buttonIndex === index);
            });

            if (shouldTrack) {
                trackSelectContent({
                    contentType: 'extra_evidence_preview',
                    itemId: caseId,
                    itemName: activeItem.label,
                    sectionName: 'extra_evidence_modal',
                    interactionAction: 'select_preview',
                    elementType: 'thumbnail_button',
                    elementLabel: activeItem.label,
                    modalName: 'extra_evidence_modal',
                    evidence_phase: activeItem.phase || 'unknown'
                });
            }
        };

        const createEvidenceButton = (item, laneLabel) => {
            const button = document.createElement('button');
            button.className = 'extra-evidence-item';
            button.type = 'button';
            button.dataset.index = String(item.__index);

            const visual = document.createElement('div');
            visual.className = 'extra-evidence-thumb-visual';

            const image = document.createElement('img');
            image.src = item.src;
            image.alt = item.alt;
            image.loading = 'lazy';

            const phaseBadge = document.createElement('span');
            phaseBadge.className = `extra-evidence-phase is-${item.phase}`;
            phaseBadge.textContent = laneLabel;

            const caption = document.createElement('span');
            caption.className = 'extra-evidence-caption';
            caption.textContent = item.label;

            visual.append(image, phaseBadge);
            button.append(visual, caption);
            button.addEventListener('click', () => setActive(item.__index, true));
            thumbButtons.push(button);
            return button;
        };

        const createMissingSlot = (phase, reason, laneLabel) => {
            const empty = document.createElement('div');
            empty.className = `extra-evidence-empty is-${phase}`;

            const label = document.createElement('span');
            label.className = 'extra-evidence-empty-label';
            label.textContent = laneLabel;

            const body = document.createElement('p');
            body.className = 'extra-evidence-empty-text';
            body.textContent = reason;

            empty.append(label, body);
            return empty;
        };

        evidencePairs.forEach((pair, pairIndex) => {
            const suffix = toPairSuffix(pairIndex);
            const card = document.createElement('article');
            card.className = 'extra-evidence-pair-card';

            const body = document.createElement('div');
            body.className = 'extra-evidence-pair-body';

            const beforeLane = document.createElement('div');
            beforeLane.className = 'extra-evidence-slot is-before';
            const afterLane = document.createElement('div');
            afterLane.className = 'extra-evidence-slot is-after';

            if (pair.before) {
                beforeLane.appendChild(createEvidenceButton(pair.before, `BEFORE-${suffix}`));
            } else {
                const reason = pair.after?.missingBeforeReason || 'N/A 또는 비교축 미수집으로 before 증거가 없습니다.';
                beforeLane.appendChild(createMissingSlot('before', reason, `BEFORE-${suffix}`));
            }

            if (pair.after) {
                afterLane.appendChild(createEvidenceButton(pair.after, `AFTER-${suffix}`));
            } else {
                const reason = pair.before?.missingAfterReason || '해당 비교축의 after 증거가 아직 없거나 범위에서 제외되었습니다.';
                afterLane.appendChild(createMissingSlot('after', reason, `AFTER-${suffix}`));
            }

            body.append(beforeLane, afterLane);
            card.appendChild(body);
            pairList.appendChild(card);
        });

        zoomButton.addEventListener('click', () => {
            const nextZoom = !isZoomed;
            setZoom(nextZoom);
            trackSelectContent({
                contentType: 'extra_evidence_zoom',
                itemId: caseId,
                itemName: sortedItems[activeIndex]?.label || 'unknown_evidence',
                sectionName: 'extra_evidence_modal',
                interactionAction: nextZoom ? 'zoom_in' : 'zoom_reset',
                elementType: 'button',
                elementLabel: 'ZOOM',
                modalName: 'extra_evidence_modal'
            });
        });
        previewImageWrap.addEventListener('click', () => {
            const nextZoom = !isZoomed;
            setZoom(nextZoom);
            trackSelectContent({
                contentType: 'extra_evidence_zoom',
                itemId: caseId,
                itemName: sortedItems[activeIndex]?.label || 'unknown_evidence',
                sectionName: 'extra_evidence_modal',
                interactionAction: nextZoom ? 'zoom_in' : 'zoom_reset',
                elementType: 'image',
                elementLabel: 'PREVIEW_IMAGE',
                modalName: 'extra_evidence_modal'
            });
        });

        originalLink.addEventListener('click', () => {
            const activeItem = sortedItems[activeIndex];
            trackSelectContent({
                contentType: 'extra_evidence_original',
                itemId: caseId,
                itemName: activeItem?.label || 'unknown_evidence',
                sectionName: 'extra_evidence_modal',
                interactionAction: 'open_link',
                elementType: 'link',
                elementLabel: 'OPEN_ORIGINAL',
                linkUrl: activeItem?.src || originalLink.href,
                linkType: detectLinkType(activeItem?.src || originalLink.href),
                modalName: 'extra_evidence_modal',
                evidence_phase: activeItem?.phase || 'unknown'
            });
        });

        previewImageWrap.appendChild(previewImage);
        previewActions.append(zoomButton, originalLink);
        preview.append(previewImageWrap, previewCaption, previewActions);

        listPanel.appendChild(pairList);
        layout.append(listPanel, preview);
        modalContent.replaceChildren(layout);
        setActive(activeIndex);
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        syncModalBodyLock();

        trackSelectContent({
            contentType: 'extra_evidence',
            itemId: caseId,
            itemName: heading || 'Extra Images',
            sectionName: 'case_card',
            interactionAction: 'open_modal',
            elementType: 'modal',
            elementLabel: heading || 'Extra Images',
            modalName: 'extra_evidence_modal',
            open_source: source,
            value: normalizedItems.length
        });
    };

    modal.querySelectorAll('[data-extra-close]').forEach((node) => {
        node.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
        if (!modal.classList.contains('is-open')) {
            return;
        }
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    openExtraEvidenceModal = openModal;
}

function injectMermaidSources() {
    const nodes = Array.from(document.querySelectorAll('.mermaid'));
    const diagrams = templateConfig.diagrams ?? {};

    nodes.forEach((container) => {
        const mermaidId = container.getAttribute('data-mermaid-id') || '';
        if (mermaidId && diagrams[mermaidId]) {
            container.innerHTML = diagrams[mermaidId];
            return;
        }

        const label = toSafeLabel(mermaidId || 'undefined_id');
        container.innerHTML = `
            graph TD
            A[${label}] --> B[Define templateConfig.diagrams entry]
        `;
    });

    return nodes;
}

function setupMermaidModal() {
    const modal = byId('mermaid-modal');
    const modalContent = byId('mermaid-modal-content');
    const modalTitle = byId('mermaid-modal-title');
    const modalDialog = modal?.querySelector('.mermaid-modal-dialog') ?? null;

    if (!modal || !modalContent || !modalTitle || !modalDialog) {
        return;
    }

    const targets = document.querySelectorAll('.graph-container, .card-visual');
    const ZOOM_STEP = 0.15;
    const ZOOM_MIN = 0.55;
    const ZOOM_MAX = 3;

    let zoom = 1;
    let activeSvg = null;
    let activeCanvas = null;
    let baseSvgWidth = 0;
    let baseSvgHeight = 0;
    let isPanning = false;
    let panStartX = 0;
    let panStartY = 0;
    let panStartScrollLeft = 0;
    let panStartScrollTop = 0;
    let activeMermaidId = 'unknown_diagram';

    let controls = modal.querySelector('.mermaid-modal-controls');
    if (!controls) {
        controls = document.createElement('div');
        controls.className = 'mermaid-modal-controls';
        controls.innerHTML = `
            <button class="mermaid-zoom-btn" type="button" data-mermaid-zoom="out" aria-label="Zoom out">-</button>
            <button class="mermaid-zoom-btn" type="button" data-mermaid-zoom="reset" aria-label="Reset zoom">RESET</button>
            <button class="mermaid-zoom-btn" type="button" data-mermaid-zoom="in" aria-label="Zoom in">+</button>
            <span class="mermaid-zoom-value" aria-live="polite">100%</span>
        `;
        modalDialog.appendChild(controls);
    }

    const zoomValue = controls.querySelector('.mermaid-zoom-value');

    const centerModalView = () => {
        const maxLeft = modalContent.scrollWidth - modalContent.clientWidth;
        if (maxLeft > 0) {
            modalContent.scrollLeft = Math.floor(maxLeft / 2);
            return;
        }
        modalContent.scrollLeft = 0;
    };

    const scheduleCenterModalView = () => {
        window.requestAnimationFrame(() => {
            centerModalView();
            window.requestAnimationFrame(centerModalView);
        });
    };

    const endPan = () => {
        if (!isPanning) {
            return;
        }
        isPanning = false;
        modalContent.classList.remove('is-panning');
    };

    const applyZoom = () => {
        if (!activeSvg || !activeCanvas) {
            return;
        }
        const nextWidth = Math.max(1, Math.round(baseSvgWidth * zoom));
        const nextHeight = Math.max(1, Math.round(baseSvgHeight * zoom));
        activeCanvas.style.width = `${nextWidth}px`;
        activeCanvas.style.height = `${nextHeight}px`;
        activeSvg.style.maxWidth = 'none';
        activeSvg.style.width = '100%';
        activeSvg.style.height = '100%';
        activeSvg.setAttribute('width', String(baseSvgWidth));
        activeSvg.setAttribute('height', String(baseSvgHeight));

        if (zoom > 1.001) {
            modalContent.classList.add('can-pan');
        } else {
            endPan();
            modalContent.classList.remove('can-pan');
        }
        zoomValue.textContent = `${Math.round(zoom * 100)}%`;
    };

    const setZoom = (nextZoom) => {
        const clampedZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextZoom));
        if (Math.abs(clampedZoom - zoom) < 0.0001) {
            return;
        }
        zoom = clampedZoom;
        applyZoom();
    };

    const closeModal = () => {
        const wasOpen = modal.classList.contains('is-open');
        const closingTitle = modalTitle.textContent || 'Mermaid Diagram';
        const modalDurationMs = analyticsSession.mermaidModalOpenedAt
            ? Math.max(0, Date.now() - analyticsSession.mermaidModalOpenedAt)
            : 0;
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        modalContent.replaceChildren();
        endPan();
        modalContent.classList.remove('can-pan');
        activeSvg = null;
        activeCanvas = null;
        baseSvgWidth = 0;
        baseSvgHeight = 0;
        zoom = 1;
        zoomValue.textContent = '100%';
        syncModalBodyLock();
        analyticsSession.mermaidModalOpenedAt = 0;

        if (wasOpen) {
            trackSelectContent({
                contentType: 'mermaid_diagram',
                itemId: activeMermaidId,
                itemName: closingTitle,
                sectionName: 'mermaid_modal',
                interactionAction: 'close_modal',
                elementType: 'modal',
                elementLabel: closingTitle,
                modalName: 'mermaid_modal',
                duration_ms: modalDurationMs,
                value: Math.round(modalDurationMs / 1000)
            });
        }
        activeMermaidId = 'unknown_diagram';
    };

    const openModal = (target) => {
        const sourceSvg = target.querySelector('.mermaid svg');
        if (!sourceSvg) {
            return;
        }

        const clonedSvg = sourceSvg.cloneNode(true);
        clonedSvg.style.maxWidth = 'none';
        clonedSvg.style.width = '100%';
        clonedSvg.style.height = '100%';

        const viewBox = sourceSvg.getAttribute('viewBox');
        let calculatedBaseWidth = 0;
        let calculatedBaseHeight = 0;
        if (viewBox) {
            const parts = viewBox.trim().split(/\s+/).map(Number);
            if (parts.length === 4 && parts.every(Number.isFinite)) {
                const modalBaseScale = 1.08;
                calculatedBaseWidth = Math.round(parts[2] * modalBaseScale);
                calculatedBaseHeight = Math.round(parts[3] * modalBaseScale);
            }
        }

        if (calculatedBaseWidth <= 0 || calculatedBaseHeight <= 0) {
            const rect = sourceSvg.getBoundingClientRect();
            const modalBaseScale = 1.08;
            calculatedBaseWidth = Math.max(1, Math.round(rect.width * modalBaseScale));
            calculatedBaseHeight = Math.max(1, Math.round(rect.height * modalBaseScale));
        }

        baseSvgWidth = calculatedBaseWidth;
        baseSvgHeight = calculatedBaseHeight;

        clonedSvg.setAttribute('width', String(baseSvgWidth));
        clonedSvg.setAttribute('height', String(baseSvgHeight));

        const canvas = document.createElement('div');
        canvas.className = 'mermaid-modal-canvas';
        canvas.style.width = `${baseSvgWidth}px`;
        canvas.style.height = `${baseSvgHeight}px`;
        canvas.appendChild(clonedSvg);

        modalContent.replaceChildren(canvas);
        modalContent.scrollLeft = 0;
        modalContent.scrollTop = 0;
        activeCanvas = canvas;
        activeSvg = clonedSvg;
        zoom = 1;
        applyZoom();

        const titleText =
            target.closest('.service-card')?.querySelector('.card-title')?.textContent?.trim() ||
            target.closest('.hero-panel')?.querySelector('.panel-title')?.textContent?.trim() ||
            'Mermaid Diagram';
        const sourceType = target.closest('.service-card') ? 'service_card' : 'hero_panel';
        const diagramId =
            target.querySelector('.mermaid')?.getAttribute('data-mermaid-id') ||
            toSafeLabel(titleText);
        activeMermaidId = diagramId;
        analyticsSession.mermaidModalOpenedAt = Date.now();
        modalTitle.textContent = titleText;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        syncModalBodyLock();
        scheduleCenterModalView();

        trackSelectContent({
            contentType: 'mermaid_diagram',
            itemId: diagramId,
            itemName: titleText,
            sectionName: 'diagram',
            interactionAction: 'open_modal',
            elementType: 'diagram',
            elementLabel: titleText,
            modalName: 'mermaid_modal',
            open_source: sourceType
        });
    };

    controls.querySelectorAll('[data-mermaid-zoom]').forEach((button) => {
        button.addEventListener('click', (event) => {
            const control = event.currentTarget;
            if (!(control instanceof HTMLElement)) {
                return;
            }
            const action = control.getAttribute('data-mermaid-zoom');
            if (!action || !modal.classList.contains('is-open')) {
                return;
            }

            if (action === 'in') {
                setZoom(zoom + ZOOM_STEP);
                trackSelectContent({
                    contentType: 'mermaid_zoom',
                    itemId: modalTitle.textContent || 'Mermaid Diagram',
                    itemName: modalTitle.textContent || 'Mermaid Diagram',
                    sectionName: 'mermaid_modal',
                    interactionAction: 'zoom_in',
                    elementType: 'button',
                    elementLabel: 'ZOOM_IN',
                    modalName: 'mermaid_modal'
                });
                return;
            }
            if (action === 'out') {
                setZoom(zoom - ZOOM_STEP);
                trackSelectContent({
                    contentType: 'mermaid_zoom',
                    itemId: modalTitle.textContent || 'Mermaid Diagram',
                    itemName: modalTitle.textContent || 'Mermaid Diagram',
                    sectionName: 'mermaid_modal',
                    interactionAction: 'zoom_out',
                    elementType: 'button',
                    elementLabel: 'ZOOM_OUT',
                    modalName: 'mermaid_modal'
                });
                return;
            }
            zoom = 1;
            applyZoom();
            scheduleCenterModalView();
            trackSelectContent({
                contentType: 'mermaid_zoom',
                itemId: modalTitle.textContent || 'Mermaid Diagram',
                itemName: modalTitle.textContent || 'Mermaid Diagram',
                sectionName: 'mermaid_modal',
                interactionAction: 'zoom_reset',
                elementType: 'button',
                elementLabel: 'ZOOM_RESET',
                modalName: 'mermaid_modal'
            });
        });
    });

    modalContent.addEventListener('wheel', (event) => {
        if (!modal.classList.contains('is-open') || !activeSvg || !event.ctrlKey) {
            return;
        }
        event.preventDefault();
        if (event.deltaY < 0) {
            setZoom(zoom + ZOOM_STEP);
            return;
        }
        setZoom(zoom - ZOOM_STEP);
    }, { passive: false });

    modalContent.addEventListener('pointerdown', (event) => {
        if (!modal.classList.contains('is-open') || !activeSvg || zoom <= 1.001) {
            return;
        }
        if (event.button !== 0) {
            return;
        }
        isPanning = true;
        panStartX = event.clientX;
        panStartY = event.clientY;
        panStartScrollLeft = modalContent.scrollLeft;
        panStartScrollTop = modalContent.scrollTop;
        modalContent.classList.add('is-panning');
        event.preventDefault();
    });

    modalContent.addEventListener('pointermove', (event) => {
        if (!isPanning) {
            return;
        }
        const deltaX = event.clientX - panStartX;
        const deltaY = event.clientY - panStartY;
        modalContent.scrollLeft = panStartScrollLeft - deltaX;
        modalContent.scrollTop = panStartScrollTop - deltaY;
        event.preventDefault();
    });

    modalContent.addEventListener('pointerup', endPan);
    modalContent.addEventListener('pointercancel', endPan);
    modalContent.addEventListener('pointerleave', (event) => {
        if (isPanning && !(event.buttons & 1)) {
            endPan();
        }
    });

    targets.forEach((target) => {
        target.classList.add('mermaid-zoom-target');
        target.setAttribute('tabindex', '0');
        target.setAttribute('role', 'button');
        target.setAttribute('aria-label', 'Open expanded Mermaid diagram');

        target.addEventListener('click', () => openModal(target));
        target.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openModal(target);
            }
        });
    });

    modal.querySelectorAll('[data-mermaid-close]').forEach((closeButton) => {
        closeButton.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
        if (!modal.classList.contains('is-open')) {
            return;
        }
        if (event.key === 'Escape') {
            closeModal();
            return;
        }
        if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            setZoom(zoom + ZOOM_STEP);
            return;
        }
        if (event.key === '-' || event.key === '_') {
            event.preventDefault();
            setZoom(zoom - ZOOM_STEP);
            return;
        }
        if (event.key === '0') {
            event.preventDefault();
            zoom = 1;
            applyZoom();
            scheduleCenterModalView();
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const revealHashTarget = (hashValue, triggerSource = 'hash_navigation') => {
        const targetId = String(hashValue || '').replace(/^#/, '').trim();
        if (!targetId) {
            return;
        }
        const revealed = ensureCaseCardVisible(targetId);
        if (!revealed) {
            return;
        }
        window.setTimeout(() => {
            const target = byId(targetId);
            if (!target) {
                return;
            }
            target.scrollIntoView({ block: 'start' });
            const showcaseId = target.closest('.service-section')?.id || '';
            trackSelectContent({
                contentType: 'case_showcase_reveal',
                itemId: targetId,
                itemName: target.querySelector('.card-title')?.textContent?.trim() || targetId,
                sectionName: 'service_section',
                interactionAction: 'reveal_target',
                elementType: 'section',
                elementLabel: 'CASE_SHOWCASE_REVEAL',
                trigger_source: triggerSource,
                showcase_id: showcaseId
            });
        }, 0);
    };

    setSystemInfo();
    setupAnalyticsLifecycle();
    setupK6OverviewModal();
    setupExtraEvidenceModal();
    renderHero();
    renderTopPanels();
    renderSkills();
    renderServiceSections();
    renderContact();
    renderNavigation();
    revealHashTarget(window.location.hash, 'initial_hash');
    window.addEventListener('hashchange', () => {
        revealHashTarget(window.location.hash, 'hash_change');
    });
    setupUptime();
    setupMobileNav();

    const mermaidNodes = injectMermaidSources();
    for (let index = 0; index < mermaidNodes.length; index += 1) {
        const node = mermaidNodes[index];
        const tempClass = `mermaid-render-target-${index}`;
        node.classList.add(tempClass);
        try {
            await mermaid.run({ querySelector: `.${tempClass}` });
        } catch (error) {
            console.error('Mermaid render failed for node:', node, error);
            const failedId = node.getAttribute('data-mermaid-id') || 'unknown';
            node.innerHTML = `<p style="margin:0;color:#ffb4b4;">Diagram render failed: ${failedId}</p>`;
        } finally {
            node.classList.remove(tempClass);
        }
    }

    setupMermaidModal();
    setupScrollSpy();
});
