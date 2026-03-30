import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
import { templateConfig } from './config.js';
import { byId, toSafeLabel } from './js/shared/dom.js';
import { detectLinkType } from './js/shared/link.js';
import {
    normalizeEvidenceLabel,
    buildEvidencePairKey,
    normalizeEvidenceItems,
    buildEvidencePairs
} from './js/shared/evidence.js';
import { initializeMermaid } from './js/shared/mermaid.js';
import { createCaseDetailInteractionTracking, createCaseDetailTracking } from './js/pages/case-detail/tracking.js';
import { createCaseEvidenceModal } from './js/pages/case-detail/evidence-modal.js';
import { initCaseDetailPage } from './js/pages/case-detail/init.js';
import {
    collectCaseCards as collectCaseCardsModule,
    buildCaseList as buildCaseListModule,
    buildCaseDetail as buildCaseDetailModule,
    isPerformanceEvidenceLink,
    parseCaseQueryFromHref
} from './js/pages/case-detail/render.js';

initializeMermaid(mermaid);
const {
    analyticsSession,
    trackSelectContent,
    getCurrentItemId,
    getCurrentItemName,
    setupAnalyticsLifecycle,
    trackInitialPageView
} = createCaseDetailTracking();
const resolveCaseEvidencePairKey = (item) => buildEvidencePairKey(item, { collapseK6Numbers: true });
const {
    rebuildEvidenceModalItems,
    openEvidenceModalByElement,
    setupEvidenceModalControls
} = createCaseEvidenceModal({
    byId,
    toSafeLabel,
    detectLinkType,
    trackSelectContent,
    getCurrentItemId,
    getCurrentItemName,
    getPageType: () => analyticsSession.pageType
});

const collectCaseCards = () => collectCaseCardsModule({ templateConfig });

const buildCaseList = (root, cards) => {
    buildCaseListModule(root, cards);
};

const buildCaseDetail = (root, cards, selected) => {
    buildCaseDetailModule(root, cards, selected, {
        normalizeEvidenceItems,
        buildEvidencePairs,
        resolveCaseEvidencePairKey,
        normalizeEvidenceLabel
    });
};

const { setupInteractionTracking } = createCaseDetailInteractionTracking({
    trackSelectContent,
    getCurrentItemId,
    getCurrentItemName,
    getPageType: () => analyticsSession.pageType,
    detectLinkType,
    isPerformanceEvidenceLink,
    parseCaseQueryFromHref,
    openEvidenceModalByElement,
    toSafeLabel
});

initCaseDetailPage({
    byId,
    setupInteractionTracking,
    setupEvidenceModalControls,
    collectCaseCards,
    buildCaseList,
    buildCaseDetail,
    rebuildEvidenceModalItems,
    templateConfig,
    mermaid,
    analyticsSession,
    setupAnalyticsLifecycle,
    trackInitialPageView
});
