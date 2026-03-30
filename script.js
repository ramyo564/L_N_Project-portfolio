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
import {
    renderHero as renderHeroModule,
    renderTopPanels as renderTopPanelsModule,
    renderSkills as renderSkillsModule,
    renderContact as renderContactModule,
    renderNavigation as renderNavigationModule
} from './js/pages/home/render/layout-render.js';
import {
    renderServiceSections as renderServiceSectionsModule,
    buildRevealHashTarget
} from './js/pages/home/render/sections.js';
import { initHomePage } from './js/pages/home/init.js';

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
    renderHeroModule({
        templateConfig,
        byId,
        setText,
        trackSelectContent,
        getOpenK6OverviewModal: () => openK6OverviewModal
    });
}

function renderTopPanels() {
    renderTopPanelsModule({
        templateConfig,
        byId
    });
}

function renderSkills() {
    renderSkillsModule({
        templateConfig,
        byId,
        setText
    });
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

let openExtraEvidenceModal = null;

function renderServiceSections() {
    renderServiceSectionsModule({
        templateConfig,
        byId,
        trackSelectContent,
        detectLinkType,
        normalizeEvidenceItems,
        toCaseReviewLink,
        getOpenExtraEvidenceModal: () => openExtraEvidenceModal,
        getOpenK6OverviewModal: () => openK6OverviewModal,
        revealHashTarget
    });
}

const revealHashTarget = buildRevealHashTarget({
    byId,
    trackSelectContent
});

function renderContact() {
    renderContactModule({
        templateConfig,
        byId,
        setText,
        detectLinkType,
        trackSelectContent
    });
}

function renderNavigation() {
    renderNavigationModule({
        templateConfig,
        byId,
        normalizeHashTarget,
        detectLinkType,
        trackSelectContent
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

initHomePage({
    setSystemInfo,
    setupAnalyticsLifecycle,
    setupK6OverviewModal,
    setupExtraEvidenceModal,
    renderHero,
    renderTopPanels,
    renderSkills,
    renderServiceSections,
    renderContact,
    renderNavigation,
    setupUptime,
    setupMobileNav,
    injectMermaidSources,
    runMermaidWithTempClass,
    mermaid,
    setupMermaidModal,
    setupScrollSpy,
    revealHashTarget
});
