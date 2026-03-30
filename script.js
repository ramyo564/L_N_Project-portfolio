import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
import { templateConfig } from './config.js';
import { byId, toSafeLabel } from './js/shared/dom.js';
import { detectLinkType } from './js/shared/link.js';
import {
    createTrackSelectContent,
    updateMaxScrollPercent as updateAnalyticsMaxScrollPercent,
    stopVisibleTimer as stopAnalyticsVisibleTimer,
    startVisibleTimer as startAnalyticsVisibleTimer,
    setupAnalyticsLifecycle as setupSharedAnalyticsLifecycle
} from './js/shared/analytics.js';
import {
    buildEvidencePairs,
    normalizeEvidenceItems
} from './js/shared/evidence.js';
import { initializeMermaid, runMermaidWithTempClass } from './js/shared/mermaid.js';
import { setupK6OverviewModal as setupK6OverviewModalModule } from './js/pages/home/modals/k6-overview-modal.js';
import { setupExtraEvidenceModal as setupExtraEvidenceModalModule } from './js/pages/home/modals/extra-evidence-modal.js';
import { setupMermaidModal as setupMermaidModalModule } from './js/pages/home/modals/mermaid-modal.js';

initializeMermaid(mermaid, templateConfig.mermaid);

function normalizeHashTarget(target) {
    if (!target) {
        return '#';
    }
    return target.startsWith('#') ? target : `#${target}`;
}

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

    try {
        await runMermaidWithTempClass(mermaid, container, { classPrefix: 'mermaid-reflow-target' });
    } catch (error) {
        console.error('Mermaid re-render failed for node:', container, error);
        const failedId = container.getAttribute('data-mermaid-id') || 'unknown';
        container.innerHTML = `<p style="margin:0;color:#ffb4b4;">Diagram render failed: ${failedId}</p>`;
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

function parseCaseDetailNumber(href) {
    const text = String(href || '').trim();
    // Support numeric case/CASE-N.md AND alphanumeric case-A/CASE-A.md
    const match = text.match(/(?:^|\/)case(?:-?)([0-9a-zA-Z]+)\/CASE-([0-9a-zA-Z]+)\.md$/i);
    if (!match) {
        return null;
    }
    const val = match[1];
    const num = Number.parseInt(val, 10);
    return Number.isFinite(num) ? num : val;
}

function toCaseReviewLink(href) {
    const caseNumber = parseCaseDetailNumber(href);
    if (!caseNumber) {
        return String(href || '');
    }
    return `./case-detail.html?case=${caseNumber}`;
}

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

function syncModalBodyLock() {
    const hasOpenModal = Boolean(
        document.querySelector('.mermaid-modal.is-open, .extra-evidence-modal.is-open, .k6-overview-modal.is-open')
    );
    document.body.classList.toggle('modal-open', hasOpenModal);
}

function getModalReturnFocusTarget(modal) {
    const activeElement = document.activeElement;
    if (!(activeElement instanceof HTMLElement)) {
        return null;
    }
    if (activeElement === document.body || activeElement === document.documentElement) {
        return null;
    }
    if (modal.contains(activeElement)) {
        return null;
    }
    return activeElement;
}

function restoreModalFocus(target) {
    if (target instanceof HTMLElement && target.isConnected && typeof target.focus === 'function') {
        try {
            target.focus({ preventScroll: true });
            return;
        } catch {
            target.focus();
            return;
        }
    }

    if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
    }
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
    kicker.textContent = 'SUMMARY';

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
                impact: String(item?.impact || '').trim(),
                links: item?.links || []
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
                card.id = `brief-${item.anchorId.replace(/^#/, '')}`;
            }

            const header = document.createElement('div');
            header.className = 'section-recruiter-card-header';
            header.style.cursor = 'pointer';

            const idLine = document.createElement('p');
            idLine.className = 'section-recruiter-card-id';
            idLine.textContent = item.id || 'Case';

            const cardTitle = document.createElement('h4');
            cardTitle.className = 'section-recruiter-card-title';
            cardTitle.textContent = item.title || '핵심 변화';

            header.append(idLine, cardTitle);

            const toggleHint = document.createElement('div');
            toggleHint.className = 'section-recruiter-card-toggle-hint';
            toggleHint.textContent = 'DETAILS';
            header.appendChild(toggleHint);

            const details = document.createElement('div');
            details.className = 'section-recruiter-card-details';

            const createRow = (labelText, valueText) => {
                if (!valueText) {
                    return null;
                }
                const row = document.createElement('p');
                row.className = 'section-recruiter-card-row';
                row.style.marginBottom = '0.4rem';

                const label = document.createElement('span');
                label.className = 'section-recruiter-card-key';
                label.style.display = 'block';
                label.style.fontWeight = 'bold';
                label.style.color = 'var(--accent-orange)';
                label.style.fontSize = '0.65rem';
                label.textContent = labelText;

                const value = document.createElement('span');
                value.className = 'section-recruiter-card-value';
                value.style.fontSize = '0.78rem';
                value.style.color = 'var(--text-secondary)';
                value.textContent = valueText;

                row.append(label, value);
                return row;
            };

            const problemRow = createRow('PROBLEM', item.problem);
            const actionRow = createRow('ACTION', item.action);
            const impactRow = createRow('IMPACT', item.impact);

            if (problemRow) details.appendChild(problemRow);
            if (actionRow) details.appendChild(actionRow);
            if (impactRow) details.appendChild(impactRow);

            // [추가] links 필드가 있으면 버튼으로 렌더링
            if (Array.isArray(item.links)) {
                item.links.forEach(linkInfo => {
                    if (linkInfo.href) {
                        const btn = document.createElement('a');
                        btn.className = 'card-extra-btn';
                        btn.style.display = 'block';
                        btn.style.width = '100%';
                        btn.style.marginTop = '0.8rem';
                        btn.style.textAlign = 'center';
                        btn.href = linkInfo.href;
                        btn.target = '_blank';
                        btn.rel = 'noopener noreferrer';
                        btn.textContent = linkInfo.label || 'GO TO PAGE';
                        // GTM 추적 추가
                        btn.addEventListener('click', () => {
                            trackSelectContent({
                                contentType: 'recruiter_brief_link',
                                itemId: item.id || 'brief_case',
                                itemName: item.title || 'Brief Case',
                                sectionName: 'recruiter_brief',
                                interactionAction: 'open_link',
                                elementType: 'link',
                                elementLabel: linkInfo.label || 'LINK',
                                linkUrl: linkInfo.href
                            });
                        });
                        details.appendChild(btn);
                    }
                });
            }

            if (item.anchorId) {
                const gotoBtn = document.createElement('button');
                gotoBtn.className = 'card-extra-btn';
                gotoBtn.style.marginTop = '0.8rem';
                gotoBtn.style.width = '100%';
                gotoBtn.textContent = 'GO_TO_FULL_PROBLEM_SOLVING';

                gotoBtn.addEventListener('click', (e) => {                    e.stopPropagation();
                    const targetId = item.anchorId.replace(/^#/, '');
                    revealHashTarget(targetId, 'recruiter_card_goto');
                });
                details.appendChild(gotoBtn);
            }

            card.append(header, details);

            card.addEventListener('click', () => {
                const isExpanded = card.classList.toggle('is-expanded');
                trackSelectContent({
                    contentType: 'recruiter_quick_brief_card',
                    itemId: item.id || 'unknown_case',
                    itemName: item.title || 'unknown_case',
                    sectionName: 'recruiter_quick_brief',
                    interactionAction: isExpanded ? 'expand' : 'collapse',
                    elementType: 'article',
                    elementLabel: item.id || 'unknown_case'
                });
            });

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
        link.addEventListener('click', (e) => {
            if (originalHref === '#k6-overview') {
                e.preventDefault();
                if (typeof openK6OverviewModal === 'function') {
                    const hero = templateConfig.hero || {};
                    openK6OverviewModal(hero.k6Overview, item.label || 'K6_TEST_ENVIRONMENT');
                }
            }

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
    description.textContent = overviewText;

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
    if (card.businessImpact) {
        const impact = document.createElement('p');
        impact.className = 'card-business-impact';
        impact.innerHTML = '<strong>🎯 비즈니스 임팩트:</strong> ' + card.businessImpact;
        content.append(impact);
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

        sectionWrapper.append(header);
        if (recruiterBrief) {
            sectionWrapper.appendChild(recruiterBrief);
        }
        sectionWrapper.appendChild(groupsContainer);
        container.appendChild(sectionWrapper);
    });
}

function revealHashTarget(hashValue, triggerSource = 'hash_navigation') {
    const targetId = String(hashValue || '').replace(/^#/, '').trim();
    if (!targetId) {
        return;
    }

    window.setTimeout(() => {
        const target = byId(targetId) || byId(`brief-${targetId}`);
        if (!target) {
            return;
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        target.classList.remove('is-target-highlight');
        void target.offsetWidth; // trigger reflow
        target.classList.add('is-target-highlight');

        // Also check if it's a recruiter card to expand it
        if (target.classList.contains('section-recruiter-card')) {
            target.classList.add('is-expanded');
        }

        const showcaseId = target.closest('.service-section')?.id || '';
        trackSelectContent({
            contentType: 'hash_target_reveal',
            itemId: targetId,
            itemName: target.querySelector('.card-title, .section-recruiter-card-title')?.textContent?.trim() || targetId,
            sectionName: 'service_section',
            interactionAction: 'reveal_target',
            elementType: 'section',
            elementLabel: 'HASH_TARGET_REVEAL',
            trigger_source: triggerSource,
            showcase_id: showcaseId
        });
    }, 100);
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
    openK6OverviewModal = setupK6OverviewModalModule({
        byId,
        analyticsSession,
        restoreModalFocus,
        getModalReturnFocusTarget,
        syncModalBodyLock,
        trackSelectContent,
        detectLinkType,
        getOpenExtraEvidenceModal: () => openExtraEvidenceModal
    }) || null;
}

function setupExtraEvidenceModal() {
    openExtraEvidenceModal = setupExtraEvidenceModalModule({
        byId,
        analyticsSession,
        restoreModalFocus,
        getModalReturnFocusTarget,
        syncModalBodyLock,
        trackSelectContent,
        detectLinkType,
        normalizeEvidenceItems,
        buildEvidencePairs,
        toPairSuffix
    }) || null;
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
    setupMermaidModalModule({
        byId,
        toSafeLabel,
        analyticsSession,
        restoreModalFocus,
        getModalReturnFocusTarget,
        syncModalBodyLock,
        trackSelectContent
    });
}

document.addEventListener('DOMContentLoaded', async () => {
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
    setupUptime();
    setupMobileNav();

    const mermaidNodes = injectMermaidSources();
    for (let index = 0; index < mermaidNodes.length; index += 1) {
        const node = mermaidNodes[index];
        try {
            await runMermaidWithTempClass(mermaid, node, { classPrefix: `mermaid-render-target-${index}` });
        } catch (error) {
            console.error('Mermaid render failed for node:', node, error);
            const failedId = node.getAttribute('data-mermaid-id') || 'unknown';
            node.innerHTML = `<p style="margin:0;color:#ffb4b4;">Diagram render failed: ${failedId}</p>`;
        }
    }

    setupMermaidModal();
    setupScrollSpy();

    if (window.location.hash) {
        revealHashTarget(window.location.hash, 'page_load');
    }
    window.addEventListener('hashchange', () => {
        revealHashTarget(window.location.hash, 'hash_change');
    });
});
