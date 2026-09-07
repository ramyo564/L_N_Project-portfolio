/**
 * Swiss Minimalist Portfolio Engine (Core Presentation Framework)
 * - Single Responsibility Principle (SRP): Pure presentation & DOM interaction logic
 * - Dependency Inversion Principle (DIP): Depends strictly on PortfolioConfig DTO
 * - Open-Closed Principle (OCP): Works out of the box for any project without modifying engine code
 */

export function setupClock(clockId = 'clock-display') {
    const clockEl = document.getElementById(clockId);
    if (!clockEl) return;

    const updateTime = () => {
        const now = new Date();
        const options = { timeZone: 'Asia/Seoul', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        clockEl.textContent = now.toLocaleTimeString('en-GB', options);
    };

    updateTime();
    setInterval(updateTime, 1000);
}

export function setupModal({
    modalId = 'image-modal',
    modalImgId = 'modal-img',
    modalTitleId = 'modal-title',
    closeBtnId = 'modal-close',
    backdropId = 'modal-backdrop'
} = {}) {
    const modal = document.getElementById(modalId);
    const modalImg = document.getElementById(modalImgId);
    const modalTitle = document.getElementById(modalTitleId);
    let closeBtn = document.getElementById(closeBtnId);
    const backdrop = document.getElementById(backdropId);

    if (!modal || !modalImg) return null;

    const contentWrap = modal.querySelector('#modal-content-wrap') || modalImg.parentElement;

    // Dynamically ensure an SVG wrapper exists for Mermaid modals
    let modalSvgWrap = modal.querySelector('#modal-svg-wrap');
    if (!modalSvgWrap && contentWrap) {
        modalSvgWrap = document.createElement('div');
        modalSvgWrap.id = 'modal-svg-wrap';
        modalSvgWrap.style.display = 'none';
        contentWrap.appendChild(modalSvgWrap);
    }

    // Ensure zoom controls bar exists in header if not already in markup
    let actionTools = modal.querySelector('.modal-action-tools');
    let zoomInBtn = modal.querySelector('#modal-zoom-in');
    let zoomOutBtn = modal.querySelector('#modal-zoom-out');
    let zoomResetBtn = modal.querySelector('#modal-zoom-reset');
    let zoomValEl = modal.querySelector('#modal-zoom-value');

    if (!zoomInBtn && closeBtn && closeBtn.parentElement) {
        const headerBar = closeBtn.parentElement;
        headerBar.classList.add('modal-header-bar');

        actionTools = document.createElement('div');
        actionTools.className = 'modal-action-tools';

        zoomOutBtn = document.createElement('button');
        zoomOutBtn.id = 'modal-zoom-out';
        zoomOutBtn.className = 'modal-tool-btn';
        zoomOutBtn.type = 'button';
        zoomOutBtn.title = 'Zoom Out';
        zoomOutBtn.textContent = '−';

        zoomValEl = document.createElement('span');
        zoomValEl.id = 'modal-zoom-value';
        zoomValEl.className = 'modal-zoom-display';
        zoomValEl.textContent = '100%';

        zoomInBtn = document.createElement('button');
        zoomInBtn.id = 'modal-zoom-in';
        zoomInBtn.className = 'modal-tool-btn';
        zoomInBtn.type = 'button';
        zoomInBtn.title = 'Zoom In';
        zoomInBtn.textContent = '+';

        zoomResetBtn = document.createElement('button');
        zoomResetBtn.id = 'modal-zoom-reset';
        zoomResetBtn.className = 'modal-tool-btn';
        zoomResetBtn.type = 'button';
        zoomResetBtn.title = 'Reset Zoom';
        zoomResetBtn.textContent = 'RESET';

        headerBar.insertBefore(actionTools, closeBtn);
        actionTools.appendChild(zoomOutBtn);
        actionTools.appendChild(zoomValEl);
        actionTools.appendChild(zoomInBtn);
        actionTools.appendChild(zoomResetBtn);
        actionTools.appendChild(closeBtn);
    }

    // Unified Canvas State & Dynamic Geometry
    let currentZoom = 1.0;
    let activeType = null; // 'svg' | 'img'
    let baseDimensions = { width: 1000, height: 600 };

    const computeFittedBase = (natW, natH) => {
        const wrapW = contentWrap?.clientWidth || window.innerWidth * 0.9;
        const wrapH = contentWrap?.clientHeight || window.innerHeight * 0.75;
        // Keep 48px margin around viewport
        const maxAvailW = Math.max(wrapW - 64, 320);
        const maxAvailH = Math.max(wrapH - 64, 240);

        // Fit within maxAvailW x maxAvailH without aspect distortion
        const scale = Math.min(maxAvailW / natW, maxAvailH / natH, 1.25);
        return {
            width: Math.max(Math.round(natW * scale), 200),
            height: Math.max(Math.round(natH * scale), 120)
        };
    };

    const applyZoom = (newZoom) => {
        currentZoom = Math.min(Math.max(Number(newZoom.toFixed(2)), 0.5), 3.5);
        if (zoomValEl) zoomValEl.textContent = `${Math.round(currentZoom * 100)}%`;

        if (contentWrap) {
            if (currentZoom > 1.0) {
                contentWrap.classList.add('is-draggable');
            } else {
                contentWrap.classList.remove('is-draggable', 'is-dragging');
            }
        }

        const targetW = Math.round(baseDimensions.width * currentZoom);
        const targetH = Math.round(baseDimensions.height * currentZoom);

        if (activeType === 'svg' && modalSvgWrap) {
            modalSvgWrap.style.width = `${targetW}px`;
            modalSvgWrap.style.height = `${targetH}px`;
            modalSvgWrap.style.minWidth = `${targetW}px`;
            modalSvgWrap.style.minHeight = `${targetH}px`;

            const svg = modalSvgWrap.querySelector('svg');
            if (svg) {
                svg.style.width = `${targetW}px`;
                svg.style.height = `${targetH}px`;
                svg.style.minWidth = `${targetW}px`;
                svg.style.minHeight = `${targetH}px`;
                svg.style.maxWidth = 'none';
                svg.style.maxHeight = 'none';
                svg.style.display = 'block';
            }
        } else if (activeType === 'img' && modalImg) {
            modalImg.style.width = `${targetW}px`;
            modalImg.style.height = `${targetH}px`;
            modalImg.style.minWidth = `${targetW}px`;
            modalImg.style.minHeight = `${targetH}px`;
            modalImg.style.maxWidth = 'none';
            modalImg.style.maxHeight = 'none';
        }
    };

    const resetZoom = () => {
        applyZoom(1.0);
        if (contentWrap) {
            // Center the canvas inside the scroll area
            setTimeout(() => {
                if (contentWrap) {
                    contentWrap.scrollLeft = Math.max(0, (contentWrap.scrollWidth - contentWrap.clientWidth) / 2);
                    contentWrap.scrollTop = Math.max(0, (contentWrap.scrollHeight - contentWrap.clientHeight) / 2);
                }
            }, 30);
        }
    };

    // Zoom Buttons Event Listeners
    zoomInBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        applyZoom(currentZoom + 0.25);
    });

    zoomOutBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        applyZoom(currentZoom - 0.25);
    });

    zoomResetBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        resetZoom();
    });

    // Drag to pan inside modal viewport when zoomed in
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeftStart = 0;
    let scrollTopStart = 0;

    if (contentWrap) {
        contentWrap.addEventListener('mousedown', (e) => {
            if (currentZoom <= 1.0 || e.target.closest('button')) return;
            isDragging = true;
            contentWrap.classList.add('is-dragging');
            startX = e.pageX - contentWrap.offsetLeft;
            startY = e.pageY - contentWrap.offsetTop;
            scrollLeftStart = contentWrap.scrollLeft;
            scrollTopStart = contentWrap.scrollTop;
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                contentWrap?.classList.remove('is-dragging');
            }
        });

        contentWrap.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - contentWrap.offsetLeft;
            const y = e.pageY - contentWrap.offsetTop;
            contentWrap.scrollLeft = scrollLeftStart - (x - startX);
            contentWrap.scrollTop = scrollTopStart - (y - startY);
        });

        // Wheel zoom with Ctrl or Trackpad pinch
        contentWrap.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY < 0 ? 0.2 : -0.2;
                applyZoom(currentZoom + delta);
            }
        }, { passive: false });
    }

    const closeModal = () => {
        document.body.style.overflow = '';
        modal.classList.remove('is-open');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        modalImg.src = '';
        modalImg.style.width = 'auto';
        modalImg.style.height = 'auto';
        modalImg.style.maxWidth = '100%';
        modalImg.style.maxHeight = '100%';
        if (modalSvgWrap) {
            modalSvgWrap.innerHTML = '';
            modalSvgWrap.style.display = 'none';
            modalSvgWrap.style.width = 'auto';
            modalSvgWrap.style.height = 'auto';
        }
        activeType = null;
        currentZoom = 1.0;
        if (zoomValEl) zoomValEl.textContent = '100%';
    };

    const openModal = (src, title) => {
        activeType = 'img';
        if (modalSvgWrap) {
            modalSvgWrap.innerHTML = '';
            modalSvgWrap.style.display = 'none';
        }
        modalImg.style.display = 'block';
        modalImg.src = src;
        if (modalTitle) modalTitle.textContent = title || '실측 성능 증거 고해상도 검증';

        document.body.style.overflow = 'hidden';
        modal.classList.add('is-open');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');

        const updateImgSize = () => {
            const natW = modalImg.naturalWidth || 1280;
            const natH = modalImg.naturalHeight || 800;
            baseDimensions = computeFittedBase(natW, natH);
            resetZoom();
        };

        if (modalImg.complete && modalImg.naturalWidth > 0) {
            updateImgSize();
        } else {
            modalImg.onload = updateImgSize;
        }
    };

    const openSvgModal = (svgHtml, title) => {
        activeType = 'svg';
        modalImg.style.display = 'none';
        modalImg.src = '';
        if (modalTitle) modalTitle.textContent = title || '아키텍처 다이어그램 고해상도 검증';

        document.body.style.overflow = 'hidden';
        modal.classList.add('is-open');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');

        if (modalSvgWrap) {
            modalSvgWrap.style.display = 'flex';
            modalSvgWrap.innerHTML = svgHtml;

            const svg = modalSvgWrap.querySelector('svg');
            if (svg) {
                // Parse natural SVG dimensions from viewBox or attributes
                let natW = 1200;
                let natH = 700;

                const viewBox = svg.getAttribute('viewBox');
                if (viewBox) {
                    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
                    if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
                        natW = parts[2];
                        natH = parts[3];
                    }
                } else if (svg.hasAttribute('width') && svg.hasAttribute('height')) {
                    natW = parseFloat(svg.getAttribute('width')) || natW;
                    natH = parseFloat(svg.getAttribute('height')) || natH;
                }

                svg.removeAttribute('width');
                svg.removeAttribute('height');
                svg.style.maxWidth = 'none';
                svg.style.maxHeight = 'none';

                baseDimensions = computeFittedBase(natW, natH);
            }
        }
        resetZoom();
    };

    closeBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && (modal.classList.contains('is-open') || modal.style.display === 'flex')) {
            closeModal();
        }
    });

    return { openModal, openSvgModal, closeModal };
}

export function renderHero(heroConfig, modalControls = null, config = null) {
    if (!heroConfig) return;

    const kickerEl = document.querySelector('.hero-kicker');
    if (kickerEl && heroConfig.kicker) kickerEl.textContent = heroConfig.kicker;

    const headlineEl = document.querySelector('.hero-headline');
    if (headlineEl && heroConfig.headline) headlineEl.innerHTML = heroConfig.headline;

    const descEl = document.querySelector('.hero-description');
    if (descEl && heroConfig.description) descEl.textContent = heroConfig.description;

    const metricsContainer = document.getElementById('hero-metrics-strip') || document.querySelector('.hero-metrics-strip');
    if (metricsContainer && Array.isArray(heroConfig.killerMetrics)) {
        metricsContainer.innerHTML = heroConfig.killerMetrics.map((m) => `
            <div class="metric-item">
                <div class="metric-number">${m.number}</div>
                <div class="metric-label">${m.label}</div>
                <div class="metric-desc">${m.desc}</div>
            </div>
        `).join('');
    }

    if (heroConfig.diagramId && config?.diagrams?.[heroConfig.diagramId]) {
        let heroDiagWrap = document.querySelector('.hero-overview-diagram-wrap');
        if (!heroDiagWrap && metricsContainer && metricsContainer.parentElement) {
            heroDiagWrap = document.createElement('div');
            heroDiagWrap.className = 'hero-overview-diagram-wrap';
            metricsContainer.parentElement.appendChild(heroDiagWrap);
        }
        if (heroDiagWrap) {
            const diagramCode = config.diagrams[heroConfig.diagramId];
            heroDiagWrap.innerHTML = `
                <figure class="evidence-figure hero-architecture-figure" style="margin: 0; cursor: pointer;">
                    <div class="evidence-img-container evidence-mermaid-wrap" style="min-height: 380px;">
                        <span class="evidence-tag-badge is-arch">SYSTEM ARCHITECTURE MASTER OVERVIEW</span>
                        <div class="mermaid" data-mermaid-id="${heroConfig.diagramId}">${diagramCode}</div>
                    </div>
                    <figcaption class="evidence-caption" style="margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                        <span style="font-weight: 600; color: #FFFFFF;">${heroConfig.diagramTitle || 'Life Navigation 전체 분산 백엔드 & AI 워커 시스템 아키텍처'}</span>
                        <span style="color: #71717A; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;">클릭 시 고해상도 벡터 뷰어 및 줌(Zoom) 열기 ↗</span>
                    </figcaption>
                </figure>
            `;
            heroDiagWrap.querySelector('figure')?.addEventListener('click', () => {
                const svgEl = heroDiagWrap.querySelector('.mermaid svg');
                if (svgEl) {
                    modalControls?.openSvgModal(svgEl.outerHTML, heroConfig.diagramTitle || '시스템 전체 아키텍처 마스터 다이어그램');
                }
            });
        }
    }
}

export function renderHeroIndex(cases, containerId = 'hero-case-index') {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(cases)) return;

    container.innerHTML = '';
    cases.forEach((item) => {
        const link = document.createElement('a');
        link.className = 'hero-index-item';
        link.href = `#case-${item.number}`;
        link.innerHTML = `
            <div class="hero-index-meta">
                <span class="hero-index-num">${item.number}</span>
                <span class="hero-index-category">${item.category}</span>
            </div>
            <div class="hero-index-title">${item.shortTitle || item.title}</div>
            <div class="hero-index-footer">
                <span class="hero-index-metric">${item.highlightMetric || ''}</span>
                <span class="hero-index-arrow">↗</span>
            </div>
        `;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(`case-${item.number}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, '', `#case-${item.number}`);
            }
        });

        container.appendChild(link);
    });
}

export function renderCases(cases, containerId = 'cases-container', modalControls = null, config = null) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(cases)) return;

    container.innerHTML = '';

    cases.forEach((item) => {
        const row = document.createElement('article');
        row.className = 'case-row';
        row.id = `case-${item.number}`;

        const grid = document.createElement('div');
        grid.className = 'case-grid';

        // Left Narrative Column
        const narrative = document.createElement('div');
        narrative.className = 'case-narrative';

        const metaTop = document.createElement('div');
        metaTop.className = 'case-meta-top';
        metaTop.innerHTML = `
            <span class="case-number">${item.number}</span>
            <span class="case-category">${item.category}</span>
            <span>·</span>
            <span>${item.period}</span>
        `;

        const title = document.createElement('h3');
        title.className = 'case-title';
        title.textContent = item.title;

        const summary = document.createElement('p');
        summary.className = 'case-summary-text';
        summary.textContent = item.summary;

        const metricsList = document.createElement('div');
        metricsList.className = 'case-metrics-list';
        (item.metrics || []).forEach((m) => {
            const mRow = document.createElement('div');
            mRow.className = `case-metric-row ${m.highlight ? 'is-highlight' : ''}`.trim();
            mRow.innerHTML = `
                <span class="metric-k">${m.label}</span>
                <span class="metric-v">${m.value}</span>
            `;
            metricsList.appendChild(mRow);
        });

        const cta = document.createElement('a');
        cta.className = 'case-detail-cta';
        cta.href = item.detailLink || `./case-detail.html?case=${item.number}`;
        cta.textContent = item.detailLinkLabel || '상세 기술 리포트 보기 ↗';

        narrative.append(metaTop, title, summary, metricsList, cta);

        // Right Evidence Column
        const evidenceCol = document.createElement('div');
        evidenceCol.className = 'case-evidence-col';

        const pairGrid = document.createElement('div');
        pairGrid.className = 'evidence-pair-grid';

        (item.evidence || []).forEach((ev) => {
            const figure = document.createElement('figure');
            figure.className = 'evidence-figure';

            const tagUpper = ev.tag?.toUpperCase() || 'EVIDENCE';
            const isBefore = tagUpper === 'BEFORE';
            const isAfter = tagUpper === 'AFTER';
            const badgeClass = isBefore ? 'is-before' : (isAfter ? 'is-after' : 'is-arch');

            if (ev.src) {
                figure.innerHTML = `
                    <div class="evidence-img-container">
                        <span class="evidence-tag-badge ${badgeClass}">${ev.tag}</span>
                        <img src="${ev.src}" alt="${ev.alt || ev.title}" loading="lazy">
                    </div>
                    <figcaption class="evidence-caption">${ev.title}</figcaption>
                `;

                figure.addEventListener('click', () => {
                    modalControls?.openModal(ev.src, `${item.number} · ${ev.tag}: ${ev.title}`);
                    if (window.dataLayer) {
                        window.dataLayer.push({
                            event: 'view_evidence_image',
                            case_number: item.number,
                            evidence_tag: ev.tag
                        });
                    }
                });
            } else if (ev.mermaidId && config?.diagrams?.[ev.mermaidId]) {
                const diagramCode = config.diagrams[ev.mermaidId];
                figure.innerHTML = `
                    <div class="evidence-img-container evidence-mermaid-wrap">
                        <span class="evidence-tag-badge ${badgeClass}">${ev.tag || 'ARCHITECTURE'}</span>
                        <div class="mermaid" data-mermaid-id="${ev.mermaidId}">${diagramCode}</div>
                    </div>
                    <figcaption class="evidence-caption">${ev.title}</figcaption>
                `;

                figure.addEventListener('click', () => {
                    const svgEl = figure.querySelector('.mermaid svg');
                    if (svgEl) {
                        modalControls?.openSvgModal(svgEl.outerHTML, `${item.number} · ${ev.tag || 'ARCHITECTURE'}: ${ev.title}`);
                    }
                    if (window.dataLayer) {
                        window.dataLayer.push({
                            event: 'view_evidence_diagram',
                            case_number: item.number,
                            evidence_tag: ev.tag || 'ARCHITECTURE',
                            mermaid_id: ev.mermaidId
                        });
                    }
                });
            } else {
                figure.innerHTML = `
                    <div class="evidence-img-container evidence-slot-fallback">
                        <span class="evidence-tag-badge ${badgeClass}">${ev.tag || 'DIAGRAM'}</span>
                        <div class="evidence-fallback-text">${ev.title}</div>
                    </div>
                    <figcaption class="evidence-caption">${ev.title}</figcaption>
                `;
            }

            pairGrid.appendChild(figure);
        });

        evidenceCol.appendChild(pairGrid);
        grid.append(narrative, evidenceCol);
        row.appendChild(grid);
        container.appendChild(row);
    });
}

export function setupFloatingTicker(cases, tickerId = 'floating-case-ticker', sectionId = 'cases') {
    const ticker = document.getElementById(tickerId);
    if (!ticker || !Array.isArray(cases)) return;

    ticker.innerHTML = '';
    cases.forEach((item) => {
        const tickerItem = document.createElement('a');
        tickerItem.className = 'ticker-item';
        tickerItem.href = `#case-${item.number}`;
        tickerItem.setAttribute('data-case', item.number);
        tickerItem.innerHTML = `
            <span class="ticker-line"></span>
            <span class="ticker-num">${item.number}</span>
            <span class="ticker-text">${item.shortTitle || item.title}</span>
        `;

        tickerItem.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(`case-${item.number}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, '', `#case-${item.number}`);
            }
        });

        ticker.appendChild(tickerItem);
    });

    const casesSection = document.getElementById(sectionId);
    const caseRows = document.querySelectorAll('.case-row');

    const handleScrollVisibility = () => {
        if (!casesSection) return;
        const rect = casesSection.getBoundingClientRect();
        const isVisible = rect.top <= 300 && rect.bottom >= 200;
        if (isVisible) {
            ticker.classList.add('is-visible');
        } else {
            ticker.classList.remove('is-visible');
        }
    };

    window.addEventListener('scroll', handleScrollVisibility, { passive: true });
    handleScrollVisibility();

    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '-25% 0px -45% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const caseNum = entry.target.id.replace('case-', '');
                    ticker.querySelectorAll('.ticker-item').forEach((item) => {
                        if (item.getAttribute('data-case') === caseNum) {
                            item.classList.add('is-active');
                        } else {
                            item.classList.remove('is-active');
                        }
                    });
                }
            });
        }, observerOptions);

        caseRows.forEach((row) => observer.observe(row));
    }
}

export function renderArchitectureIndex(sections, containerId = 'hero-case-index') {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(sections)) return;

    container.innerHTML = '';
    sections.forEach((sec) => {
        const link = document.createElement('a');
        link.className = 'hero-index-item';
        link.href = `#section-${sec.number || sec.id}`;
        link.innerHTML = `
            <div class="hero-index-meta">
                <span class="hero-index-num">${sec.number}</span>
                <span class="hero-index-category">${sec.category}</span>
            </div>
            <div class="hero-index-title">${sec.title}</div>
            <div class="hero-index-footer">
                <span class="hero-index-metric">${(sec.diagrams || []).length} DIAGRAMS</span>
                <span class="hero-index-arrow">↗</span>
            </div>
        `;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(`section-${sec.number || sec.id}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, '', `#section-${sec.number || sec.id}`);
            }
        });

        container.appendChild(link);
    });
}

export function renderArchitectureSections(sections, containerId = 'cases-container', modalControls = null, config = null) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(sections)) return;

    container.innerHTML = '';

    sections.forEach((sec) => {
        const secEl = document.createElement('section');
        secEl.className = 'arch-section';
        secEl.id = `section-${sec.number || sec.id}`;

        const secHeader = document.createElement('div');
        secHeader.className = 'arch-section-header';
        secHeader.innerHTML = `
            <div class="arch-meta-top">
                <span class="arch-number">${sec.number}</span>
                <span class="arch-category">${sec.category}</span>
                <span>·</span>
                <span>${sec.subtitle || ''}</span>
            </div>
            <h3 class="arch-title">${sec.title}</h3>
            <p class="arch-desc">${sec.description || ''}</p>
        `;

        if (Array.isArray(sec.brief) && sec.brief.length > 0) {
            const briefWrap = document.createElement('div');
            briefWrap.className = 'arch-brief-grid';
            sec.brief.forEach((b) => {
                const bCard = document.createElement('div');
                bCard.className = 'arch-brief-item';
                bCard.innerHTML = `
                    <div class="arch-brief-header">
                        <span class="arch-brief-badge">${b.id}</span>
                        <span class="arch-brief-title">${b.title}</span>
                    </div>
                    <div class="arch-brief-row"><span class="k">Problem:</span> <span class="v">${b.problem}</span></div>
                    <div class="arch-brief-row"><span class="k">Action:</span> <span class="v">${b.action}</span></div>
                    <div class="arch-brief-row is-impact"><span class="k">Impact:</span> <span class="v">${b.impact}</span></div>
                `;
                briefWrap.appendChild(bCard);
            });
            secHeader.appendChild(briefWrap);
        }

        const diagGrid = document.createElement('div');
        diagGrid.className = 'arch-diagram-grid';

        (sec.diagrams || []).forEach((diag) => {
            const figure = document.createElement('figure');
            figure.className = 'evidence-figure arch-diagram-figure';
            figure.style.cursor = 'pointer';

            const diagramCode = config?.diagrams?.[diag.mermaidId];
            if (diagramCode) {
                figure.innerHTML = `
                    <div class="evidence-img-container evidence-mermaid-wrap">
                        <span class="evidence-tag-badge is-arch">${diag.badge || sec.category || 'ARCHITECTURE'}</span>
                        <div class="mermaid" data-mermaid-id="${diag.mermaidId}">${diagramCode}</div>
                    </div>
                    <figcaption class="evidence-caption">
                        <div class="arch-diag-caption-title">${diag.title}</div>
                        <div class="arch-diag-caption-desc">${diag.description || ''}</div>
                    </figcaption>
                `;

                figure.addEventListener('click', () => {
                    const svgEl = figure.querySelector('.mermaid svg');
                    if (svgEl) {
                        modalControls?.openSvgModal(svgEl.outerHTML, `${sec.number} · ${diag.title}`);
                    }
                    if (window.dataLayer) {
                        window.dataLayer.push({
                            event: 'view_evidence_diagram',
                            section: sec.number,
                            mermaid_id: diag.mermaidId
                        });
                    }
                });
            }
            diagGrid.appendChild(figure);
        });

        secEl.append(secHeader, diagGrid);
        container.appendChild(secEl);
    });
}

export function setupArchitectureTicker(sections, tickerId = 'floating-case-ticker', sectionId = 'cases') {
    const ticker = document.getElementById(tickerId);
    if (!ticker || !Array.isArray(sections)) return;

    ticker.innerHTML = '';
    sections.forEach((item) => {
        const tickerItem = document.createElement('a');
        tickerItem.className = 'ticker-item';
        tickerItem.href = `#section-${item.number || item.id}`;
        tickerItem.setAttribute('data-section', item.number || item.id);
        tickerItem.innerHTML = `
            <span class="ticker-line"></span>
            <span class="ticker-num">${item.number}</span>
            <span class="ticker-text">${item.shortTitle || item.category || item.title}</span>
        `;

        tickerItem.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(`section-${item.number || item.id}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                history.pushState(null, '', `#section-${item.number || item.id}`);
            }
        });

        ticker.appendChild(tickerItem);
    });

    const casesSection = document.getElementById(sectionId);
    const archSections = document.querySelectorAll('.arch-section');

    const handleScrollVisibility = () => {
        if (!casesSection) return;
        const rect = casesSection.getBoundingClientRect();
        const isVisible = rect.top <= 300 && rect.bottom >= 200;
        if (isVisible) {
            ticker.classList.add('is-visible');
        } else {
            ticker.classList.remove('is-visible');
        }
    };

    window.addEventListener('scroll', handleScrollVisibility, { passive: true });
    handleScrollVisibility();

    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -40% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const secNum = entry.target.id.replace('section-', '');
                    ticker.querySelectorAll('.ticker-item').forEach((item) => {
                        if (item.getAttribute('data-section') === secNum) {
                            item.classList.add('is-active');
                        } else {
                            item.classList.remove('is-active');
                        }
                    });
                }
            });
        }, observerOptions);

        archSections.forEach((sec) => observer.observe(sec));
    }
}

/**
 * Main Facade Initializer
 * 단 한 줄로 포트폴리오의 모든 라이프사이클을 가동합니다.
 */
export function initPortfolio(config) {
    if (!config) {
        console.error('[PortfolioEngine] Configuration is required to initialize.');
        return;
    }

    setupClock();
    const modalControls = setupModal();
    renderHero(config.hero, modalControls, config);

    if (Array.isArray(config.sections) && config.sections.length > 0) {
        // Mode B: Architecture Blueprint & Specification Hub
        renderArchitectureIndex(config.sections);
        renderArchitectureSections(config.sections, 'cases-container', modalControls, config);
        setupArchitectureTicker(config.sections);
    } else if (Array.isArray(config.cases) && config.cases.length > 0) {
        // Mode A: Problem-Solving Portfolio
        renderHeroIndex(config.cases);
        renderCases(config.cases, 'cases-container', modalControls, config);
        setupFloatingTicker(config.cases);
    }

    // Initialize Mermaid if diagrams exist
    if (config.diagrams && Object.keys(config.diagrams).length > 0) {
        import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs').then((m) => {
            const mermaid = m.default;
            mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                themeVariables: {
                    darkMode: true,
                    background: '#050505',
                    mainBkg: '#121212',
                    textColor: '#E4E4E7',
                    lineColor: 'rgba(255, 255, 255, 0.35)',
                    primaryColor: '#1A1A1A',
                    primaryTextColor: '#FFFFFF',
                    primaryBorderColor: 'rgba(255, 255, 255, 0.25)'
                }
            });
            mermaid.run({ querySelector: '.mermaid' });
        }).catch((err) => console.warn('[PortfolioEngine] Mermaid load skipped:', err));
    }
}
