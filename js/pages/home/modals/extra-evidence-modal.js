export function setupExtraEvidenceModal({
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
} = {}) {
    const modal = byId?.('extra-evidence-modal');
    const modalContent = byId?.('extra-evidence-content');
    const modalTitle = byId?.('extra-evidence-title');

    if (!modal || !modalContent || !modalTitle) {
        return null;
    }

    let activeCaseId = 'unknown_case';
    let returnFocusTarget = null;

    const closeModal = () => {
        const wasOpen = modal.classList.contains('is-open');
        const closingTitle = modalTitle.textContent || 'Extra Images';
        const modalDurationMs = analyticsSession?.extraEvidenceModalOpenedAt
            ? Math.max(0, Date.now() - analyticsSession.extraEvidenceModalOpenedAt)
            : 0;
        modal.classList.remove('is-open');
        if (wasOpen) {
            restoreModalFocus?.(returnFocusTarget);
        }
        returnFocusTarget = null;
        modal.inert = true;
        modal.setAttribute('aria-hidden', 'true');
        modalContent.replaceChildren();
        syncModalBodyLock?.();
        if (analyticsSession) {
            analyticsSession.extraEvidenceModalOpenedAt = 0;
        }

        if (wasOpen) {
            trackSelectContent?.({
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
        const normalizedItems = normalizeEvidenceItems?.(items);
        if (!Array.isArray(normalizedItems) || normalizedItems.length === 0) {
            return;
        }

        const heading = String(title || '').trim();
        const source = String(options.source || 'unknown').trim();
        const caseId = String(options.caseId || 'unknown_case').trim();
        activeCaseId = caseId;
        if (analyticsSession) {
            analyticsSession.extraEvidenceModalOpenedAt = Date.now();
        }
        returnFocusTarget = getModalReturnFocusTarget?.(modal) || null;
        modal.inert = false;
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

        const evidencePairs = buildEvidencePairs?.(sortedItems) || [];

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

        const zoomControls = document.createElement('div');
        zoomControls.className = 'extra-evidence-zoom-controls';

        const zoomOutBtn = document.createElement('button');
        zoomOutBtn.className = 'extra-evidence-zoom-btn is-icon';
        zoomOutBtn.type = 'button';
        zoomOutBtn.textContent = '-';
        zoomOutBtn.setAttribute('aria-label', 'Zoom out');

        const zoomResetBtn = document.createElement('button');
        zoomResetBtn.className = 'extra-evidence-zoom-btn is-text';
        zoomResetBtn.type = 'button';
        zoomResetBtn.textContent = 'RESET';

        const zoomInBtn = document.createElement('button');
        zoomInBtn.className = 'extra-evidence-zoom-btn is-icon';
        zoomInBtn.type = 'button';
        zoomInBtn.textContent = '+';
        zoomInBtn.setAttribute('aria-label', 'Zoom in');

        const zoomValueText = document.createElement('span');
        zoomValueText.className = 'extra-evidence-zoom-value';
        zoomValueText.textContent = '100%';

        zoomControls.append(zoomOutBtn, zoomResetBtn, zoomInBtn, zoomValueText);

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
        const ZOOM_MIN = 0.5;
        const ZOOM_MAX = 4.0;
        const ZOOM_STEP = 0.15;
        let zoomLevel = 1.0;
        let previewBaseWidth = 0;
        let previewBaseHeight = 0;
        let isPanning = false;
        let panPointerId = null;
        let panStartX = 0;
        let panStartY = 0;
        let panStartScrollLeft = 0;
        let panStartScrollTop = 0;
        let pendingTouchPan = false;
        let touchStartImageRect = null;
        let touchStartWrapRect = null;
        let suppressNextPreviewClick = false;
        const PAN_THRESHOLD = 4;
        const thumbButtons = [];

        const resetTouchGesture = () => {
            pendingTouchPan = false;
            touchStartImageRect = null;
            touchStartWrapRect = null;
        };

        const clearPreviewSizing = () => {
            isPanning = false;
            panPointerId = null;
            resetTouchGesture();
            suppressNextPreviewClick = false;
            previewBaseWidth = 0;
            previewBaseHeight = 0;
            previewImage.style.width = '';
            previewImage.style.height = '';
            previewImage.classList.remove('is-zoomed');
            previewImageWrap.classList.remove('is-zoomed');
            previewImageWrap.classList.remove('is-panning');
            previewImageWrap.scrollLeft = 0;
            previewImageWrap.scrollTop = 0;
            zoomValueText.textContent = '100%';
        };

        const centerPreviewScroll = () => {
            const maxLeft = Math.max(0, previewImageWrap.scrollWidth - previewImageWrap.clientWidth);
            const maxTop = Math.max(0, previewImageWrap.scrollHeight - previewImageWrap.clientHeight);
            previewImageWrap.scrollLeft = maxLeft > 0 ? Math.floor(maxLeft / 2) : 0;
            previewImageWrap.scrollTop = maxTop > 0 ? Math.floor(maxTop / 2) : 0;
        };

        const applyPreviewSizing = (sizeOptions = {}) => {
            const shouldCenter = sizeOptions.center !== false;
            const isZoomed = zoomLevel > ZOOM_MIN;
            const isScaled = true;
            previewImage.classList.toggle('is-zoomed', isZoomed);
            previewImageWrap.classList.toggle('is-zoomed', isScaled);
            zoomValueText.textContent = `${Math.round(zoomLevel * 100)}%`;

            if (!previewBaseWidth || !previewBaseHeight) {
                if (!isScaled) {
                    previewImage.style.width = '';
                    previewImage.style.height = '';
                    previewImageWrap.scrollLeft = 0;
                    previewImageWrap.scrollTop = 0;
                }
                return;
            }

            previewImage.style.width = `${Math.max(1, Math.round(previewBaseWidth * zoomLevel))}px`;
            previewImage.style.height = `${Math.max(1, Math.round(previewBaseHeight * zoomLevel))}px`;

            if (isScaled && shouldCenter) {
                window.requestAnimationFrame(centerPreviewScroll);
            } else if (!isScaled) {
                previewImageWrap.scrollLeft = 0;
                previewImageWrap.scrollTop = 0;
            }
        };

        const startPreviewPan = (
            event,
            initialScrollLeft = previewImageWrap.scrollLeft,
            initialScrollTop = previewImageWrap.scrollTop
        ) => {
            isPanning = true;
            panPointerId = event.pointerId;
            panStartX = event.clientX;
            panStartY = event.clientY;
            panStartScrollLeft = Math.max(0, initialScrollLeft);
            panStartScrollTop = Math.max(0, initialScrollTop);
            previewImageWrap.scrollLeft = panStartScrollLeft;
            previewImageWrap.scrollTop = panStartScrollTop;
            previewImageWrap.classList.add('is-panning');

            if (previewImageWrap.setPointerCapture) {
                previewImageWrap.setPointerCapture(event.pointerId);
            }
        };

        const endPreviewPan = () => {
            if (!isPanning) {
                return;
            }

            isPanning = false;
            previewImageWrap.classList.remove('is-panning');

            if (panPointerId !== null && previewImageWrap.hasPointerCapture(panPointerId)) {
                try {
                    previewImageWrap.releasePointerCapture(panPointerId);
                } catch {
                    // Ignore release errors if the pointer capture already ended.
                }
            }

            panPointerId = null;

            if (suppressNextPreviewClick) {
                window.setTimeout(() => {
                    suppressNextPreviewClick = false;
                }, 0);
            }
        };

        const measurePreviewSizing = () => {
            if (!previewImage.complete || previewImage.naturalWidth <= 0 || previewImage.naturalHeight <= 0) {
                return false;
            }

            const rect = previewImage.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) {
                return false;
            }

            previewBaseWidth = rect.width;
            previewBaseHeight = rect.height;
            applyPreviewSizing();
            return true;
        };

        const schedulePreviewSizing = () => {
            window.requestAnimationFrame(() => {
                window.requestAnimationFrame(measurePreviewSizing);
            });
        };

        previewImage.addEventListener('load', schedulePreviewSizing);
        previewImage.addEventListener('dragstart', (event) => event.preventDefault());

        const setZoom = (nextZoomLevel, zoomOptions = {}) => {
            zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, nextZoomLevel));
            applyPreviewSizing(zoomOptions);
        };

        const setActive = (index, shouldTrack = false) => {
            activeIndex = index;
            const activeItem = sortedItems[index];
            if (!activeItem) {
                return;
            }
            clearPreviewSizing();
            zoomLevel = 2.0;
            zoomValueText.textContent = '200%';
            previewImage.src = activeItem.src;
            previewImage.alt = activeItem.alt;
            previewCaption.textContent = `[${activeItem.phase.toUpperCase()}] ${activeItem.label}`;
            originalLink.href = activeItem.src;

            thumbButtons.forEach((button) => {
                const buttonIndex = Number(button.dataset.index || '-1');
                button.classList.toggle('is-active', buttonIndex === index);
            });

            if (shouldTrack) {
                trackSelectContent?.({
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

            if (modal.classList.contains('is-open')) {
                schedulePreviewSizing();
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
            const suffix = toPairSuffix ? toPairSuffix(pairIndex) : String(pairIndex + 1);
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
                const reason = pair.after?.missingBeforeReason || 'VU50 부하에도 오류발생 -> VU500 같은 비교축 의미 X';
                beforeLane.appendChild(createMissingSlot('before', reason, `BEFORE-${suffix}`));
            }

            if (pair.after) {
                afterLane.appendChild(createEvidenceButton(pair.after, `AFTER-${suffix}`));
            } else {
                const reason = pair.before?.missingAfterReason || 'VU500에도 안정적이라 같은 VU50 비교축 없음';
                afterLane.appendChild(createMissingSlot('after', reason, `AFTER-${suffix}`));
            }

            body.append(beforeLane, afterLane);
            card.appendChild(body);
            pairList.appendChild(card);
        });

        const trackZoom = (actionLabel) => {
            trackSelectContent?.({
                contentType: 'extra_evidence_zoom',
                itemId: caseId,
                itemName: sortedItems[activeIndex]?.label || 'unknown_evidence',
                sectionName: 'extra_evidence_modal',
                interactionAction: actionLabel,
                elementType: 'button',
                elementLabel: 'ZOOM_CONTROL',
                modalName: 'extra_evidence_modal'
            });
        };

        zoomOutBtn.addEventListener('click', () => {
            setZoom(zoomLevel - ZOOM_STEP);
            trackZoom('zoom_out');
        });

        zoomResetBtn.addEventListener('click', () => {
            setZoom(1.0);
            trackZoom('zoom_reset');
        });

        zoomInBtn.addEventListener('click', () => {
            setZoom(zoomLevel + ZOOM_STEP);
            trackZoom('zoom_in');
        });

        previewImageWrap.addEventListener('click', () => {
            if (suppressNextPreviewClick) {
                suppressNextPreviewClick = false;
            }
        });

        previewImageWrap.addEventListener('dblclick', () => {
            const nextZoom = zoomLevel > 1.0 ? 1.0 : 2.0;
            setZoom(nextZoom);
            trackZoom(nextZoom > 1.0 ? 'zoom_in_double' : 'zoom_reset_double');
        });

        previewImageWrap.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY > 0 ? -1 : 1;
            setZoom(zoomLevel + (delta * ZOOM_STEP * 1.5));
        }, { passive: false });

        previewImageWrap.addEventListener('pointerdown', (event) => {
            if (event.button !== 0) {
                return;
            }

            startPreviewPan(event);
            event.preventDefault();
        });

        previewImageWrap.addEventListener('pointermove', (event) => {
            if (isPanning) {
                if (event.pointerId !== panPointerId) {
                    return;
                }

                const deltaX = event.clientX - panStartX;
                const deltaY = event.clientY - panStartY;
                if (Math.abs(deltaX) > PAN_THRESHOLD || Math.abs(deltaY) > PAN_THRESHOLD) {
                    suppressNextPreviewClick = true;
                }
                previewImageWrap.scrollLeft = panStartScrollLeft - deltaX;
                previewImageWrap.scrollTop = panStartScrollTop - deltaY;
                event.preventDefault();
            }
        });

        const endPreviewInteraction = () => {
            const wasPanning = isPanning;
            endPreviewPan();
            resetTouchGesture();
            if (!wasPanning) {
                panPointerId = null;
            }
        };

        previewImageWrap.addEventListener('pointerup', endPreviewInteraction);
        previewImageWrap.addEventListener('pointercancel', endPreviewInteraction);
        previewImageWrap.addEventListener('pointerleave', (event) => {
            if (event.pointerId !== panPointerId) {
                return;
            }
            if (isPanning && !(event.buttons & 1)) {
                endPreviewInteraction();
            }
        });

        originalLink.addEventListener('click', () => {
            const activeItem = sortedItems[activeIndex];
            trackSelectContent?.({
                contentType: 'extra_evidence_original',
                itemId: caseId,
                itemName: activeItem?.label || 'unknown_evidence',
                sectionName: 'extra_evidence_modal',
                interactionAction: 'open_link',
                elementType: 'link',
                elementLabel: 'OPEN_ORIGINAL',
                linkUrl: activeItem?.src || originalLink.href,
                linkType: detectLinkType?.(activeItem?.src || originalLink.href),
                modalName: 'extra_evidence_modal',
                evidence_phase: activeItem?.phase || 'unknown'
            });
        });

        previewImageWrap.appendChild(previewImage);
        previewActions.append(zoomControls, originalLink);
        preview.append(previewActions, previewImageWrap, previewCaption);

        listPanel.appendChild(pairList);
        layout.append(listPanel, preview);
        modalContent.replaceChildren(layout);
        setActive(activeIndex);
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        syncModalBodyLock?.();
        schedulePreviewSizing();

        trackSelectContent?.({
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

    return openModal;
}
