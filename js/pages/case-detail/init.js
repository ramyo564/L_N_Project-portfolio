export function initCaseDetailPage({
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
} = {}) {
    const root = byId?.('case-review-root');
    if (!root) {
        return;
    }

    setupInteractionTracking?.();
    setupEvidenceModalControls?.();

    const cards = collectCaseCards?.() || [];
    if (cards.length === 0) {
        root.innerHTML = `
            <section class="case-review-panel">
                <h1>케이스 데이터가 비어 있습니다.</h1>
            </section>
        `;
        rebuildEvidenceModalItems?.();
        analyticsSession.pageType = 'case_list';
        analyticsSession.caseNumber = null;
        analyticsSession.caseTitle = 'Case Brief List';
        setupAnalyticsLifecycle?.();
        trackInitialPageView?.();
        return;
    }

    const caseParamRaw = new URLSearchParams(window.location.search).get('case') || '';
    const caseParamNum = Number.parseInt(caseParamRaw, 10);
    const caseParam = Number.isFinite(caseParamNum) ? caseParamNum : caseParamRaw;

    const selected = cards.find((item) => String(item.caseNumber) === String(caseParam));

    if (!selected) {
        buildCaseList?.(root, cards);
        rebuildEvidenceModalItems?.();
        analyticsSession.pageType = 'case_list';
        analyticsSession.caseNumber = null;
        analyticsSession.caseTitle = 'Case Brief List';
        setupAnalyticsLifecycle?.();
        trackInitialPageView?.();
        return;
    }

    buildCaseDetail?.(root, cards, selected);
    rebuildEvidenceModalItems?.();

    // 다이어그램 렌더링 실행
    const diagramContainer = byId?.('case-mermaid-container');
    if (diagramContainer && !selected.card?.hideReviewDiagram) {
        const mermaidId = diagramContainer.getAttribute('data-mermaid-id');
        const diagrams = templateConfig?.diagrams ?? {};
        if (mermaidId && diagrams[mermaidId]) {
            diagramContainer.innerHTML = diagrams[mermaidId];
            mermaid.run({ querySelector: '#case-mermaid-container' }).catch((error) => {
                console.error('Mermaid render failed in detail page:', error);
                diagramContainer.innerHTML = `<p style="color:#ffb4b4;">Diagram render failed: ${mermaidId}</p>`;
            });
        }
    }

    analyticsSession.pageType = 'case_detail';
    analyticsSession.caseNumber = selected.caseNumber;
    analyticsSession.caseTitle = selected.card?.title || `Case ${selected.caseNumber}`;
    setupAnalyticsLifecycle?.();
    trackInitialPageView?.();
}
