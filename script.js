import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
import { templateConfig } from './config.js';
import { byId, toSafeLabel } from './js/shared/dom.js';
import { detectLinkType } from './js/shared/link.js';
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
import { createHomeTracking } from './js/pages/home/tracking.js';

initializeMermaid(mermaid, templateConfig.mermaid);

function normalizeHashTarget(target) {
    if (!target) {
        return '#';
    }
    return target.startsWith('#') ? target : `#${target}`;
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

const {
    analyticsSession,
    trackSelectContent,
    setupAnalyticsLifecycle,
    setupScrollSpy
} = createHomeTracking({ byId });

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
