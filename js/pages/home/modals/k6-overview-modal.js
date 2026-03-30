export function setupK6OverviewModal({
    byId,
    analyticsSession,
    restoreModalFocus,
    getModalReturnFocusTarget,
    syncModalBodyLock,
    trackSelectContent,
    detectLinkType,
    getOpenExtraEvidenceModal
} = {}) {
    const modal = byId?.('k6-overview-modal');
    const modalContent = byId?.('k6-overview-content');
    const modalTitle = byId?.('k6-overview-title');

    if (!modal || !modalContent || !modalTitle) {
        return null;
    }

    let activeLabel = 'K6_TEST_ENVIRONMENT';
    let returnFocusTarget = null;

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
        const modalDurationMs = analyticsSession?.k6OverviewModalOpenedAt
            ? Math.max(0, Date.now() - analyticsSession.k6OverviewModalOpenedAt)
            : 0;

        modal.classList.remove('is-open');
        if (wasOpen) {
            restoreModalFocus?.(returnFocusTarget);
        }
        returnFocusTarget = null;
        modal.inert = true;
        modal.setAttribute('aria-hidden', 'true');
        modalContent.replaceChildren();
        if (analyticsSession) {
            analyticsSession.k6OverviewModalOpenedAt = 0;
        }
        syncModalBodyLock?.();

        if (wasOpen) {
            trackSelectContent?.({
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

        returnFocusTarget = getModalReturnFocusTarget?.(modal) || null;
        modal.inert = false;

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
        if (analyticsSession) {
            analyticsSession.k6OverviewModalOpenedAt = Date.now();
        }
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

        const bodyCols = document.createElement('div');
        bodyCols.className = 'k6-overview-body-cols';

        const sideCol = document.createElement('aside');
        sideCol.className = 'k6-overview-col-side';

        const mainCol = document.createElement('main');
        mainCol.className = 'k6-overview-col-main';

        if (hardwareRows.length > 0) {
            const hardwareLines = hardwareRows.map((item) => `${item.label || 'ITEM'}: ${item.value || 'N/A'}`);
            sideCol.appendChild(createListCard('HW / ENVIRONMENT', hardwareLines));
        }
        if (measurementProtocol.length > 0) {
            sideCol.appendChild(createListCard('MEASUREMENT_PROTOCOL', measurementProtocol, true));
        }

        if (resultInterpretation.length > 0) {
            mainCol.appendChild(createListCard('RESULT_INTERPRETATION', resultInterpretation));
        }
        if (keyMetrics.length > 0) {
            mainCol.appendChild(createListCard(overview.keyMetricsTitle || 'MEASURED_RESULT', keyMetrics));
        }
        if (dbRows.length > 0) {
            mainCol.appendChild(createListCard('DB_ROW_ESTIMATION', dbRows, true));
        }

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

                    const openExtraEvidenceModal = typeof getOpenExtraEvidenceModal === 'function'
                        ? getOpenExtraEvidenceModal()
                        : null;

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

                    trackSelectContent?.({
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
                        linkType: detectLinkType?.(src)
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

            mainCol.appendChild(compareSection);
        }

        bodyCols.append(sideCol, mainCol);
        layout.appendChild(bodyCols);

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
                    trackSelectContent?.({
                        contentType: 'k6_overview_link',
                        itemId: 'k6_test_environment',
                        itemName: item.label || 'LINK',
                        sectionName: 'k6_overview_modal',
                        interactionAction: 'open_link',
                        elementType: 'link',
                        elementLabel: item.label || 'LINK',
                        linkUrl: item.href,
                        linkType: detectLinkType?.(item.href),
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
        syncModalBodyLock?.();

        trackSelectContent?.({
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

    return openModal;
}
