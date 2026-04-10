export function createCaseEvidenceModal({
    byId,
    toSafeLabel,
    detectLinkType,
    trackSelectContent,
    getCurrentItemId,
    getCurrentItemName,
    getPageType
} = {}) {
    const evidenceModalState = {
        initialized: false,
        isOpen: false,
        openedAt: 0,
        currentIndex: -1,
        items: []
    };

    const evidenceZoomState = {
        isZoomed: false,
        previewBaseWidth: 0,
        previewBaseHeight: 0,
        isPanning: false,
        panPointerId: null,
        panStartX: 0,
        panStartY: 0,
        panStartScrollLeft: 0,
        panStartScrollTop: 0,
        pendingTouchPan: false,
        touchStartImageRect: null,
        touchStartWrapRect: null,
        suppressNextClick: false
    };

    const EVIDENCE_ZOOM_SCALE = 1.8;
    const EVIDENCE_PAN_THRESHOLD = 4;

    function getEvidenceModalElements() {
        return {
            modal: byId?.('case-evidence-modal'),
            imageWrap: byId?.('case-evidence-image-wrap'),
            image: byId?.('case-evidence-image'),
            title: byId?.('case-evidence-title'),
            phase: byId?.('case-evidence-phase'),
            counter: byId?.('case-evidence-counter'),
            prev: byId?.('case-evidence-prev'),
            next: byId?.('case-evidence-next'),
            openOriginal: byId?.('case-evidence-open-original')
        };
    }

    function resetEvidenceZoomState(elements = getEvidenceModalElements()) {
        evidenceZoomState.isZoomed = false;
        evidenceZoomState.previewBaseWidth = 0;
        evidenceZoomState.previewBaseHeight = 0;
        evidenceZoomState.isPanning = false;
        evidenceZoomState.panPointerId = null;
        evidenceZoomState.panStartX = 0;
        evidenceZoomState.panStartY = 0;
        evidenceZoomState.panStartScrollLeft = 0;
        evidenceZoomState.panStartScrollTop = 0;
        evidenceZoomState.pendingTouchPan = false;
        evidenceZoomState.touchStartImageRect = null;
        evidenceZoomState.touchStartWrapRect = null;
        evidenceZoomState.suppressNextClick = false;

        if (elements.image) {
            elements.image.style.width = '';
            elements.image.style.height = '';
            elements.image.classList.remove('is-zoomed');
        }
        if (elements.imageWrap) {
            elements.imageWrap.classList.remove('is-zoomed', 'is-panning');
            elements.imageWrap.scrollLeft = 0;
            elements.imageWrap.scrollTop = 0;
        }
    }

    function centerEvidenceImageScroll(elements = getEvidenceModalElements()) {
        if (!elements.imageWrap) {
            return;
        }

        const maxLeft = Math.max(0, elements.imageWrap.scrollWidth - elements.imageWrap.clientWidth);
        const maxTop = Math.max(0, elements.imageWrap.scrollHeight - elements.imageWrap.clientHeight);
        elements.imageWrap.scrollLeft = maxLeft > 0 ? Math.floor(maxLeft / 2) : 0;
        elements.imageWrap.scrollTop = maxTop > 0 ? Math.floor(maxTop / 2) : 0;
    }

    function applyEvidenceZoomSizing(elements = getEvidenceModalElements(), options = {}) {
        const shouldCenter = options.center !== false;

        if (!elements.image || !elements.imageWrap) {
            return;
        }

        elements.image.classList.toggle('is-zoomed', evidenceZoomState.isZoomed);
        elements.imageWrap.classList.toggle('is-zoomed', evidenceZoomState.isZoomed);

        if (!evidenceZoomState.previewBaseWidth || !evidenceZoomState.previewBaseHeight) {
            if (!evidenceZoomState.isZoomed) {
                elements.image.style.width = '';
                elements.image.style.height = '';
                elements.imageWrap.scrollLeft = 0;
                elements.imageWrap.scrollTop = 0;
            }
            return;
        }

        const scale = evidenceZoomState.isZoomed ? EVIDENCE_ZOOM_SCALE : 1;
        elements.image.style.width = `${Math.max(1, Math.round(evidenceZoomState.previewBaseWidth * scale))}px`;
        elements.image.style.height = `${Math.max(1, Math.round(evidenceZoomState.previewBaseHeight * scale))}px`;

        if (evidenceZoomState.isZoomed && shouldCenter) {
            window.requestAnimationFrame(() => centerEvidenceImageScroll(elements));
        } else if (!evidenceZoomState.isZoomed) {
            elements.imageWrap.scrollLeft = 0;
            elements.imageWrap.scrollTop = 0;
        }
    }

    function measureEvidenceZoomSizing(elements = getEvidenceModalElements()) {
        if (
            !elements.image ||
            !elements.imageWrap ||
            !elements.image.complete ||
            elements.image.naturalWidth <= 0 ||
            elements.image.naturalHeight <= 0
        ) {
            return false;
        }

        const rect = elements.image.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
            return false;
        }

        evidenceZoomState.previewBaseWidth = rect.width;
        evidenceZoomState.previewBaseHeight = rect.height;
        applyEvidenceZoomSizing(elements);
        return true;
    }

    function scheduleEvidenceZoomSizing(elements = getEvidenceModalElements()) {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => measureEvidenceZoomSizing(elements));
        });
    }

    function startEvidencePan(
        event,
        elements = getEvidenceModalElements(),
        initialScrollLeft = elements.imageWrap?.scrollLeft || 0,
        initialScrollTop = elements.imageWrap?.scrollTop || 0
    ) {
        if (!elements.imageWrap) {
            return;
        }

        evidenceZoomState.isPanning = true;
        evidenceZoomState.panPointerId = event.pointerId;
        evidenceZoomState.panStartX = event.clientX;
        evidenceZoomState.panStartY = event.clientY;
        evidenceZoomState.panStartScrollLeft = Math.max(0, initialScrollLeft);
        evidenceZoomState.panStartScrollTop = Math.max(0, initialScrollTop);
        elements.imageWrap.scrollLeft = evidenceZoomState.panStartScrollLeft;
        elements.imageWrap.scrollTop = evidenceZoomState.panStartScrollTop;
        elements.imageWrap.classList.add('is-panning');

        if (elements.imageWrap.setPointerCapture) {
            elements.imageWrap.setPointerCapture(event.pointerId);
        }
    }

    function resetEvidenceTouchGesture() {
        evidenceZoomState.pendingTouchPan = false;
        evidenceZoomState.touchStartImageRect = null;
        evidenceZoomState.touchStartWrapRect = null;
    }

    function beginEvidenceAutoZoomPan(event, elements = getEvidenceModalElements()) {
        if (
            !elements.imageWrap ||
            !evidenceZoomState.touchStartImageRect ||
            !evidenceZoomState.touchStartWrapRect ||
            !evidenceZoomState.previewBaseWidth ||
            !evidenceZoomState.previewBaseHeight
        ) {
            return false;
        }

        if (!evidenceZoomState.isZoomed) {
            evidenceZoomState.isZoomed = true;
            applyEvidenceZoomSizing(elements, { center: false });
        }

        const touchXInImage = Math.min(
            evidenceZoomState.touchStartImageRect.width,
            Math.max(0, event.clientX - evidenceZoomState.touchStartImageRect.left)
        );
        const touchYInImage = Math.min(
            evidenceZoomState.touchStartImageRect.height,
            Math.max(0, event.clientY - evidenceZoomState.touchStartImageRect.top)
        );
        const touchXInWrap = event.clientX - evidenceZoomState.touchStartWrapRect.left;
        const touchYInWrap = event.clientY - evidenceZoomState.touchStartWrapRect.top;
        const nextScrollLeft = Math.max(
            0,
            Math.round(touchXInImage * EVIDENCE_ZOOM_SCALE - touchXInWrap)
        );
        const nextScrollTop = Math.max(
            0,
            Math.round(touchYInImage * EVIDENCE_ZOOM_SCALE - touchYInWrap)
        );

        evidenceZoomState.suppressNextClick = true;
        startEvidencePan(event, elements, nextScrollLeft, nextScrollTop);
        resetEvidenceTouchGesture();
        return true;
    }

    function endEvidencePan(elements = getEvidenceModalElements()) {
        if (!evidenceZoomState.isPanning) {
            return;
        }

        evidenceZoomState.isPanning = false;
        if (elements.imageWrap) {
            elements.imageWrap.classList.remove('is-panning');
        }

        if (evidenceZoomState.panPointerId !== null && elements.imageWrap?.hasPointerCapture(evidenceZoomState.panPointerId)) {
            try {
                elements.imageWrap.releasePointerCapture(evidenceZoomState.panPointerId);
            } catch {
                // Ignore release errors if pointer capture already ended.
            }
        }

        evidenceZoomState.panPointerId = null;

        if (evidenceZoomState.suppressNextClick) {
            window.setTimeout(() => {
                evidenceZoomState.suppressNextClick = false;
            }, 0);
        }
    }

    function toggleEvidenceZoom(elements = getEvidenceModalElements(), nextZoom = !evidenceZoomState.isZoomed) {
        evidenceZoomState.isZoomed = nextZoom;
        applyEvidenceZoomSizing(elements);
    }

    function buildEvidenceElementLabel(item) {
        const baseLabel = typeof toSafeLabel === 'function'
            ? toSafeLabel(item?.label || 'EVIDENCE')
            : String(item?.label || 'EVIDENCE');
        const safeLabel = baseLabel.replace(/\s+/g, '_').toUpperCase();
        const phase = String(item?.phase || 'other').toUpperCase();
        return `${phase}_${safeLabel}`;
    }

    function trackEvidenceModalEvent(currentItem, interactionAction, elementType, elementLabel, extra = {}) {
        if (!currentItem) {
            return;
        }

        trackSelectContent?.({
            contentType: 'performance_evidence',
            itemId: getCurrentItemId?.(),
            itemName: getCurrentItemName?.(),
            sectionName: 'evidence_modal',
            interactionAction,
            elementType,
            elementLabel,
            linkUrl: currentItem.href,
            linkType: detectLinkType?.(currentItem.href),
            modalName: 'case_evidence_modal',
            evidence_phase: currentItem.phase,
            evidence_tier: currentItem.tier,
            evidence_pair: currentItem.pair,
            evidence_pair_index: currentItem.pairIndex,
            page_type: getPageType?.() || '',
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
            const displayLabel = element.dataset.evidenceDisplayLabel || element.querySelector('.case-evidence-slot-caption')?.textContent?.trim() || label;
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
                displayLabel,
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

        resetEvidenceZoomState(elements);
        elements.image.src = item.href;
        elements.image.alt = item.alt || item.label || 'Evidence image';
        const visibleLabel = item.displayLabel || item.label;
        const titleText = (item.pair && item.label && item.pair.toUpperCase() === item.label.toUpperCase())
            ? visibleLabel
            : `${item.pair} · ${visibleLabel}`;
        elements.title.textContent = titleText;
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
        scheduleEvidenceZoomSizing(elements);

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
        resetEvidenceZoomState(elements);

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
        scheduleEvidenceZoomSizing();

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

        if (elements.image) {
            elements.image.addEventListener('load', () => {
                if (evidenceModalState.isOpen) {
                    scheduleEvidenceZoomSizing(elements);
                }
            });
            elements.image.addEventListener('dragstart', (event) => event.preventDefault());
        }

        if (elements.imageWrap) {
            elements.imageWrap.addEventListener('click', () => {
                if (evidenceZoomState.suppressNextClick) {
                    evidenceZoomState.suppressNextClick = false;
                    return;
                }
                toggleEvidenceZoom(elements);
            });

            elements.imageWrap.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) {
                    return;
                }

                if (evidenceZoomState.isZoomed) {
                    startEvidencePan(event, elements);
                    event.preventDefault();
                    return;
                }

                if (event.pointerType === 'touch') {
                    evidenceZoomState.pendingTouchPan = true;
                    evidenceZoomState.panPointerId = event.pointerId;
                    evidenceZoomState.panStartX = event.clientX;
                    evidenceZoomState.panStartY = event.clientY;
                    evidenceZoomState.touchStartImageRect = elements.image?.getBoundingClientRect() || null;
                    evidenceZoomState.touchStartWrapRect = elements.imageWrap.getBoundingClientRect();
                }
            });

            elements.imageWrap.addEventListener('pointermove', (event) => {
                if (evidenceZoomState.isPanning) {
                    if (event.pointerId !== evidenceZoomState.panPointerId) {
                        return;
                    }

                    const deltaX = event.clientX - evidenceZoomState.panStartX;
                    const deltaY = event.clientY - evidenceZoomState.panStartY;
                    if (Math.abs(deltaX) > EVIDENCE_PAN_THRESHOLD || Math.abs(deltaY) > EVIDENCE_PAN_THRESHOLD) {
                        evidenceZoomState.suppressNextClick = true;
                    }
                    if (elements.imageWrap) {
                        elements.imageWrap.scrollLeft = evidenceZoomState.panStartScrollLeft - deltaX;
                        elements.imageWrap.scrollTop = evidenceZoomState.panStartScrollTop - deltaY;
                    }
                    event.preventDefault();
                    return;
                }

                if (!evidenceZoomState.pendingTouchPan || event.pointerId !== evidenceZoomState.panPointerId || event.pointerType !== 'touch') {
                    return;
                }

                const deltaX = event.clientX - evidenceZoomState.panStartX;
                const deltaY = event.clientY - evidenceZoomState.panStartY;
                if (Math.abs(deltaX) <= EVIDENCE_PAN_THRESHOLD && Math.abs(deltaY) <= EVIDENCE_PAN_THRESHOLD) {
                    return;
                }

                beginEvidenceAutoZoomPan(event, elements);
                event.preventDefault();
            });

            const endEvidenceInteraction = () => {
                const wasPanning = evidenceZoomState.isPanning;
                endEvidencePan(elements);
                resetEvidenceTouchGesture();
                if (!wasPanning) {
                    evidenceZoomState.panPointerId = null;
                }
            };

            elements.imageWrap.addEventListener('pointerup', endEvidenceInteraction);
            elements.imageWrap.addEventListener('pointercancel', endEvidenceInteraction);
            elements.imageWrap.addEventListener('pointerleave', (event) => {
                if (event.pointerId !== evidenceZoomState.panPointerId) {
                    return;
                }
                if (evidenceZoomState.isPanning && !(event.buttons & 1)) {
                    endEvidenceInteraction();
                }
            });
        }

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

    return {
        rebuildEvidenceModalItems,
        openEvidenceModalByElement,
        setupEvidenceModalControls
    };
}
