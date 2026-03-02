import { templateConfig } from './config.js';

function byId(id) {
    return document.getElementById(id);
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parseCaseNumber(card) {
    const title = String(card?.title || '');
    const titleMatch = title.match(/Case\s*(\d+)/i);
    if (titleMatch) {
        return Number.parseInt(titleMatch[1], 10);
    }

    const anchorId = String(card?.anchorId || '');
    const anchorMatch = anchorId.match(/case-(\d+)/i);
    if (anchorMatch) {
        return Number.parseInt(anchorMatch[1], 10);
    }

    return null;
}

function splitNarrativeLines(text) {
    const rawLines = String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    return rawLines
        .map((line) => line.replace(/^\d+\)\s*/, '').replace(/^[-*]\s*/, '').trim())
        .filter(Boolean);
}

function normalizeEvidenceItems(items) {
    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .filter((item) => item && item.src)
        .map((item) => ({
            label: item.label || 'EVIDENCE',
            src: item.src,
            alt: item.alt || item.label || 'evidence image',
            missingBeforeReason: item.missingBeforeReason || '',
            missingAfterReason: item.missingAfterReason || ''
        }));
}

function isCaseRunbookLink(href) {
    return /(?:^|\/)case\d+\/CASE-\d+\.md$/i.test(String(href || '').trim());
}

function collectCaseCards() {
    const cards = [];
    const serviceSections = Array.isArray(templateConfig?.serviceSections) ? templateConfig.serviceSections : [];

    serviceSections.forEach((section) => {
        const groups = Array.isArray(section?.groups) ? section.groups : [];
        groups.forEach((group) => {
            const groupCards = Array.isArray(group?.cards) ? group.cards : [];
            groupCards.forEach((card) => {
                const caseNumber = parseCaseNumber(card);
                if (!caseNumber) {
                    return;
                }

                cards.push({
                    caseNumber,
                    sectionTitle: section?.title || '',
                    groupTitle: group?.title || '',
                    card
                });
            });
        });
    });

    return cards.sort((a, b) => a.caseNumber - b.caseNumber);
}

function buildEvidenceGridHtml(items) {
    if (items.length === 0) {
        return '<p class="case-review-empty">등록된 이미지 증거가 없습니다.</p>';
    }

    return `
        <div class="case-evidence-grid">
            ${items.map((item) => `
                <a class="case-evidence-card" href="${escapeHtml(item.src)}" target="_blank" rel="noopener noreferrer">
                    <img loading="lazy" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}">
                    <span>${escapeHtml(item.label)}</span>
                </a>
            `).join('')}
        </div>
    `;
}

function buildSummaryBlock(title, items) {
    const content = items.length === 0
        ? '<li>정리 문구가 아직 비어 있습니다.</li>'
        : items.map((line) => `<li>${escapeHtml(line)}</li>`).join('');

    return `
        <article class="case-summary-card">
            <h3>${escapeHtml(title)}</h3>
            <ul>${content}</ul>
        </article>
    `;
}

function buildCaseList(root, cards) {
    root.innerHTML = `
        <section class="case-review-panel">
            <p class="case-kicker">SELECT_CASE</p>
            <h1>심사자용 케이스 브리프</h1>
            <p class="case-subtitle">각 케이스는 문제, 조치, 정량 결과를 먼저 확인하도록 구성됩니다.</p>
            <div class="case-list-grid">
                ${cards.map(({ caseNumber, card, groupTitle }) => `
                    <a class="case-list-card" href="./case-detail.html?case=${caseNumber}">
                        <p class="case-list-id">CASE ${caseNumber}</p>
                        <h2>${escapeHtml(card?.title || '')}</h2>
                        <p>${escapeHtml(groupTitle)}</p>
                    </a>
                `).join('')}
            </div>
        </section>
    `;
}

function buildCaseDetail(root, cards, selected) {
    const { caseNumber, groupTitle, card } = selected;
    const cardLinks = Array.isArray(card?.links) ? card.links.filter((item) => item?.href) : [];
    const runbookLink = cardLinks.find((item) => isCaseRunbookLink(item.href)) || null;
    const referenceLinks = cardLinks.filter((item) => !isCaseRunbookLink(item.href));

    const summaryProblem = splitNarrativeLines(card?.problem || card?.cause);
    const summaryAction = splitNarrativeLines(card?.solution);
    const summaryResult = splitNarrativeLines(card?.result);

    const coreEvidence = normalizeEvidenceItems(card?.evidenceImages);
    const extraEvidence = normalizeEvidenceItems(card?.extraEvidenceImages);
    const allEvidence = coreEvidence.concat(extraEvidence);
    const missingReasons = Array.from(new Set(
        allEvidence
            .flatMap((item) => [item.missingBeforeReason, item.missingAfterReason])
            .filter(Boolean)
    ));

    const index = cards.findIndex((item) => item.caseNumber === caseNumber);
    const prev = index > 0 ? cards[index - 1] : null;
    const next = index < cards.length - 1 ? cards[index + 1] : null;

    document.title = `Case ${caseNumber} Review | Yohan Portfolio`;

    const referenceButtons = [];
    if (runbookLink) {
        referenceButtons.push(`
            <a class="case-link-btn case-link-btn-runbook" href="${escapeHtml(runbookLink.href)}" target="_blank" rel="noopener noreferrer">
                RUNBOOK_MD
            </a>
        `);
    }
    referenceLinks.forEach((item) => {
        referenceButtons.push(`
            <a class="case-link-btn" href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(item.label || 'REFERENCE')}
            </a>
        `);
    });

    root.innerHTML = `
        <section class="case-review-panel case-review-hero-panel">
            <p class="case-kicker">CASE_${caseNumber}_BRIEF</p>
            <h1>${escapeHtml(card?.title || '')}</h1>
            <p class="case-subtitle">${escapeHtml(card?.subtitle || '')}</p>
            <div class="case-chip-row">
                <span class="case-chip">${escapeHtml(groupTitle)}</span>
                <span class="case-chip">${escapeHtml(card?.stackSummary || 'Stack summary 없음')}</span>
            </div>
            <div class="case-nav-row">
                <a class="case-nav-btn" href="./index.html#${escapeHtml(card?.anchorId || '')}">BACK_TO_MAIN_CASE_CARD</a>
                ${prev ? `<a class="case-nav-btn" href="./case-detail.html?case=${prev.caseNumber}">PREV_CASE_${prev.caseNumber}</a>` : ''}
                ${next ? `<a class="case-nav-btn" href="./case-detail.html?case=${next.caseNumber}">NEXT_CASE_${next.caseNumber}</a>` : ''}
            </div>
        </section>

        <section class="case-review-panel">
            <p class="section-kicker">REVIEWER_SUMMARY</p>
            <div class="case-summary-grid">
                ${buildSummaryBlock('문제', summaryProblem)}
                ${buildSummaryBlock('조치', summaryAction)}
                ${buildSummaryBlock('성과', summaryResult)}
            </div>
        </section>

        <section class="case-review-panel">
            <p class="section-kicker">EVIDENCE_AT_A_GLANCE</p>
            <h2>핵심 증거</h2>
            ${buildEvidenceGridHtml(coreEvidence)}
            <h2 class="case-section-subtitle">보조 증거</h2>
            ${buildEvidenceGridHtml(extraEvidence)}
            ${missingReasons.length > 0 ? `
                <div class="case-note-box">
                    <h3>N/A / 단측 증거 사유</h3>
                    <ul>
                        ${missingReasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </section>

        <section class="case-review-panel">
            <p class="section-kicker">TRACEABILITY</p>
            <h2>원문 및 코드 추적 링크</h2>
            <div class="case-link-row">
                ${referenceButtons.join('')}
            </div>
        </section>
    `;
}

function init() {
    const root = byId('case-review-root');
    if (!root) {
        return;
    }

    const cards = collectCaseCards();
    if (cards.length === 0) {
        root.innerHTML = `
            <section class="case-review-panel">
                <h1>케이스 데이터가 비어 있습니다.</h1>
            </section>
        `;
        return;
    }

    const caseParam = Number.parseInt(new URLSearchParams(window.location.search).get('case') || '', 10);
    const selected = cards.find((item) => item.caseNumber === caseParam);

    if (!selected) {
        buildCaseList(root, cards);
        return;
    }

    buildCaseDetail(root, cards, selected);
}

init();
