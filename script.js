/**
 * Main Application Logic (Swiss Minimalist Edition)
 * - Zero Bloat / Zero Complex Template Generators
 * - Direct, declarative rendering of portfolioCases data
 * - High-res modal viewer for recruiter evidence inspection
 */
import { portfolioCases } from './js/data/portfolio-cases.js';

// 1. Setup Seoul Real-time Clock
function setupClock() {
    const clockEl = document.getElementById('clock-display');
    if (!clockEl) return;

    const updateTime = () => {
        const now = new Date();
        const options = { timeZone: 'Asia/Seoul', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
        clockEl.textContent = now.toLocaleTimeString('en-GB', options);
    };

    updateTime();
    setInterval(updateTime, 1000);
}

// 2. Setup Evidence Modal Viewer
function setupModal() {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const closeBtn = document.getElementById('modal-close');
    const backdrop = document.getElementById('modal-backdrop');

    if (!modal || !modalImg) return;

    const closeModal = () => {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        modalImg.src = '';
    };

    const openModal = (src, title) => {
        modalImg.src = src;
        if (modalTitle) modalTitle.textContent = title || '실측 성능 증거 고해상도 검증';
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
    };

    closeBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });

    return { openModal };
}

// 3. Render Case Studies (Pure Swiss Minimalist Rows)
function renderCases(modalControls) {
    const container = document.getElementById('cases-container');
    if (!container) return;

    container.innerHTML = '';

    portfolioCases.forEach((item) => {
        const row = document.createElement('article');
        row.className = 'case-row';
        row.id = `case-${item.number}`;

        // Grid Container
        const grid = document.createElement('div');
        grid.className = 'case-grid';

        // 3A. Left Narrative Column
        const narrative = document.createElement('div');
        narrative.className = 'case-narrative';

        // Meta Top
        const metaTop = document.createElement('div');
        metaTop.className = 'case-meta-top';
        metaTop.innerHTML = `
            <span class="case-number">${item.number}</span>
            <span class="case-category">${item.category}</span>
            <span>·</span>
            <span>${item.period}</span>
        `;

        // Title
        const title = document.createElement('h3');
        title.className = 'case-title';
        title.textContent = item.title;

        // Summary
        const summary = document.createElement('p');
        summary.className = 'case-summary-text';
        summary.textContent = item.summary;

        // Metrics List
        const metricsList = document.createElement('div');
        metricsList.className = 'case-metrics-list';
        item.metrics.forEach((m) => {
            const mRow = document.createElement('div');
            mRow.className = `case-metric-row ${m.highlight ? 'is-highlight' : ''}`.trim();
            mRow.innerHTML = `
                <span class="metric-k">${m.label}</span>
                <span class="metric-v">${m.value}</span>
            `;
            metricsList.appendChild(mRow);
        });

        // Detail Link CTA
        const cta = document.createElement('a');
        cta.className = 'case-detail-cta';
        cta.href = item.detailLink;
        cta.textContent = item.detailLinkLabel || '상세 기술 리포트 보기 ↗';

        narrative.append(metaTop, title, summary, metricsList, cta);

        // 3B. Right Evidence Column
        const evidenceCol = document.createElement('div');
        evidenceCol.className = 'case-evidence-col';

        const pairGrid = document.createElement('div');
        pairGrid.className = 'evidence-pair-grid';

        item.evidence.forEach((ev) => {
            const figure = document.createElement('figure');
            figure.className = 'evidence-figure';

            const isBefore = ev.tag.toUpperCase() === 'BEFORE';
            const badgeClass = isBefore ? 'is-before' : 'is-after';

            figure.innerHTML = `
                <div class="evidence-img-container">
                    <span class="evidence-tag-badge ${badgeClass}">${ev.tag}</span>
                    <img src="${ev.src}" alt="${ev.alt || ev.title}" loading="lazy">
                </div>
                <figcaption class="evidence-caption">${ev.title}</figcaption>
            `;

            figure.addEventListener('click', () => {
                modalControls?.openModal(ev.src, `${item.number} · ${ev.tag}: ${ev.title}`);
                // Analytics
                if (window.dataLayer) {
                    window.dataLayer.push({
                        event: 'view_evidence_image',
                        case_number: item.number,
                        evidence_tag: ev.tag
                    });
                }
            });

            pairGrid.appendChild(figure);
        });

        evidenceCol.appendChild(pairGrid);

        grid.append(narrative, evidenceCol);
        row.appendChild(grid);
        container.appendChild(row);
    });
}

// 4. Render Hero Case Fast-Jump Index Strip
function renderHeroIndex() {
    const container = document.getElementById('hero-case-index');
    if (!container) return;

    container.innerHTML = '';
    portfolioCases.forEach((item) => {
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
                // Update history hash quietly
                history.pushState(null, '', `#case-${item.number}`);
            }
        });

        container.appendChild(link);
    });
}

// 5. Setup Floating Case Ticker (Visible on Scroll)
function setupFloatingTicker() {
    const ticker = document.getElementById('floating-case-ticker');
    if (!ticker) return;

    ticker.innerHTML = '';
    portfolioCases.forEach((item) => {
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

    const casesSection = document.getElementById('cases');
    const caseRows = document.querySelectorAll('.case-row');

    // Visibility toggle based on scroll position within #cases
    const handleScrollVisibility = () => {
        if (!casesSection) return;
        const rect = casesSection.getBoundingClientRect();
        // Visible when Cases section is roughly within viewport
        const isVisible = rect.top <= 300 && rect.bottom >= 200;
        if (isVisible) {
            ticker.classList.add('is-visible');
        } else {
            ticker.classList.remove('is-visible');
        }
    };

    window.addEventListener('scroll', handleScrollVisibility, { passive: true });
    handleScrollVisibility();

    // Active item observer
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

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    setupClock();
    const modalControls = setupModal();
    renderHeroIndex();
    renderCases(modalControls);
    setupFloatingTicker();
});
