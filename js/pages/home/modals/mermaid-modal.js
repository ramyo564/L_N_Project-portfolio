export function setupMermaidModal({
    byId,
    toSafeLabel,
    analyticsSession,
    restoreModalFocus,
    getModalReturnFocusTarget,
    syncModalBodyLock,
    trackSelectContent
} = {}) {
    const modal = byId?.('mermaid-modal');
    const modalContent = byId?.('mermaid-modal-content');
    const modalTitle = byId?.('mermaid-modal-title');
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
    let returnFocusTarget = null;

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
        if (zoomValue) {
            zoomValue.textContent = `${Math.round(zoom * 100)}%`;
        }
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
        const modalDurationMs = analyticsSession?.mermaidModalOpenedAt
            ? Math.max(0, Date.now() - analyticsSession.mermaidModalOpenedAt)
            : 0;
        modal.classList.remove('is-open');
        if (wasOpen) {
            restoreModalFocus?.(returnFocusTarget);
        }
        returnFocusTarget = null;
        modal.inert = true;
        modal.setAttribute('aria-hidden', 'true');
        modalContent.replaceChildren();
        endPan();
        modalContent.classList.remove('can-pan');
        activeSvg = null;
        activeCanvas = null;
        baseSvgWidth = 0;
        baseSvgHeight = 0;
        zoom = 1;
        if (zoomValue) {
            zoomValue.textContent = '100%';
        }
        syncModalBodyLock?.();
        if (analyticsSession) {
            analyticsSession.mermaidModalOpenedAt = 0;
        }

        if (wasOpen) {
            trackSelectContent?.({
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

        returnFocusTarget = getModalReturnFocusTarget?.(modal) || null;
        modal.inert = false;

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
            toSafeLabel?.(titleText) ||
            'unknown_diagram';
        activeMermaidId = diagramId;
        if (analyticsSession) {
            analyticsSession.mermaidModalOpenedAt = Date.now();
        }
        modalTitle.textContent = titleText;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        syncModalBodyLock?.();
        scheduleCenterModalView();

        trackSelectContent?.({
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
                trackSelectContent?.({
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
                trackSelectContent?.({
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
            trackSelectContent?.({
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
