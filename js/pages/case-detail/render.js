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
    const titleMatch = title.match(/Case\s*([0-9a-zA-Z]+)/i);
    if (titleMatch) {
        const val = titleMatch[1];
        const num = Number.parseInt(val, 10);
        return Number.isFinite(num) ? num : val;
    }

    const anchorId = String(card?.anchorId || '');
    const anchorMatch = anchorId.match(/case-([0-9a-zA-Z]+)/i);
    if (anchorMatch) {
        const val = anchorMatch[1];
        const num = Number.parseInt(val, 10);
        return Number.isFinite(num) ? num : val;
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

function buildRecruiterSummaryLines(card, summaryProblem, summaryCause, summarySolution, summaryResult) {
    const explicit = Array.isArray(card?.recruiterSummary)
        ? card.recruiterSummary.map((line) => String(line || '').trim()).filter(Boolean)
        : [];
    if (explicit.length > 0) {
        return explicit.slice(0, 7);
    }

    const overviewLines = splitNarrativeLines(card?.overview || card?.description);
    const candidates = [
        overviewLines[0] || '',
        summaryProblem[0] || '',
        summaryCause[0] || '',
        summarySolution[0] || '',
        summaryResult[0] || ''
    ].map((line) => String(line || '').trim()).filter(Boolean);

    return Array.from(new Set(candidates)).slice(0, 7);
}

function isCaseDetailLink(href) {
    const text = String(href || '').trim();
    const match = text.match(/(?:^|\/)case-([0-9a-zA-Z]+)\/CASE-([0-9a-zA-Z]+)\.md$/i);
    return Boolean(match && String(match[1]).toLowerCase() === String(match[2]).toLowerCase());
}

export function isPerformanceEvidenceLink(label, href) {
    const text = `${label || ''} ${href || ''}`.toLowerCase();
    return text.includes('performance_evidence')
        || text.includes('k6')
        || text.includes('report.html')
        || text.includes('summary.json')
        || text.includes('failure-summary');
}

export function parseCaseQueryFromHref(href) {
    try {
        const targetUrl = new URL(String(href || ''), window.location.href);
        const raw = String(targetUrl.searchParams.get('case') || '').trim();
        if (!raw) {
            return null;
        }
        const value = Number.parseInt(raw, 10);
        return Number.isFinite(value) && String(value) === raw ? value : raw;
    } catch (_error) {
        return null;
    }
}

export function collectCaseCards({ templateConfig } = {}) {
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

    return cards.sort((a, b) => {
        const valA = String(a.caseNumber);
        const valB = String(b.caseNumber);
        return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
    });
}

function sanitizePairTitle(label, normalizeEvidenceLabel) {
    const normalizeLabel = typeof normalizeEvidenceLabel === 'function'
        ? normalizeEvidenceLabel
        : (value) => String(value || '');

    const cleaned = normalizeLabel(label || '')
        .replace(/^(?:pair\s*\d+\s*(?:[·:\/-]\s*)?)+/g, '')
        .replace(/\b(before|after)\b/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[\s:·\/-]+/g, '')
        .trim();
    if (!cleaned) {
        return '';
    }
    return cleaned.toUpperCase();
}

function buildEvidenceSlotHtml(item, phase, missingReason, options = {}) {
    const phaseLabel = phase === 'before' ? 'BEFORE' : 'AFTER';
    const toneClass = phase === 'before' ? 'is-before' : 'is-after';
    const pairTitle = options.pairTitle || 'PAIR';
    const pairIndex = options.pairIndex || 0;
    const tier = options.tier || 'core';
    const displayLabel = item?.displayLabel || item?.caption || item?.label || 'EVIDENCE';

    if (!item) {
        return `
            <div class="case-evidence-slot case-evidence-slot-missing ${toneClass}">
                <span class="case-evidence-phase-badge ${toneClass}">${phaseLabel}</span>
                <p class="case-evidence-missing-text">${escapeHtml(missingReason || 'N/A')}</p>
            </div>
        `;
    }

    return `
        <a
            class="case-evidence-slot ${toneClass}"
            href="${escapeHtml(item.src)}"
            target="_blank"
            rel="noopener noreferrer"
            data-track-kind="evidence_slot"
            data-evidence-phase="${escapeHtml(phase)}"
            data-evidence-tier="${escapeHtml(tier)}"
            data-evidence-label="${escapeHtml(item.label)}"
            data-evidence-display-label="${escapeHtml(displayLabel)}"
            data-evidence-pair="${escapeHtml(pairTitle)}"
            data-evidence-pair-index="${pairIndex}"
            aria-label="${phaseLabel} ${escapeHtml(displayLabel)}"
        >
            <span class="case-evidence-phase-badge ${toneClass}">${phaseLabel}</span>
            <img loading="lazy" src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}">
            <span class="case-evidence-slot-caption">${escapeHtml(displayLabel)}</span>
        </a>
    `;
}

function buildEvidencePairsHtml(items, tier, startIndex = 1, options = {}) {
    const buildEvidencePairs = options.buildEvidencePairs;
    const resolveCaseEvidencePairKey = options.resolveCaseEvidencePairKey;
    const normalizeEvidenceLabel = options.normalizeEvidenceLabel;

    if (items.length === 0) {
        return '<p class="case-review-empty">등록된 이미지 증거가 없습니다.</p>';
    }

    const pairs = typeof buildEvidencePairs === 'function'
        ? buildEvidencePairs(items, {
            includeKey: true,
            pairKeyResolver: resolveCaseEvidencePairKey
        })
        : [];
    if (pairs.length === 0) {
        return '<p class="case-review-empty">Before/After 페어를 구성할 수 있는 증거가 없습니다.</p>';
    }

    const totalEvidenceCount = Math.max(1, items.filter(Boolean).length);
    let displayIndex = 1;
    const decorateEvidenceItem = (item) => {
        if (!item) {
            return null;
        }

        const rawLabel = item.caption || item.label || 'EVIDENCE';
        const decorated = {
            ...item,
            displayLabel: `${displayIndex}/${totalEvidenceCount}. ${rawLabel}`
        };
        displayIndex += 1;
        return decorated;
    };

    return `
        <div class="case-evidence-pairs">
            ${pairs.map((pair, index) => {
                const pairTitle = sanitizePairTitle(
                    pair.before?.label || pair.after?.label || pair.key,
                    normalizeEvidenceLabel
                ) || `PAIR ${index + 1}`;
                const beforeItem = decorateEvidenceItem(pair.before);
                const afterItem = decorateEvidenceItem(pair.after);
                const missingBeforeReason = !beforeItem ? pair.after?.missingBeforeReason : '';
                const missingAfterReason = !afterItem ? pair.before?.missingAfterReason : '';
                const pairNumber = startIndex + index;

                return `
                <article class="case-evidence-pair-card">
                    <p class="case-evidence-pair-title">PAIR ${pairNumber} · ${escapeHtml(pairTitle)}</p>
                    <div class="case-evidence-frame">
                        ${buildEvidenceSlotHtml(beforeItem, 'before', missingBeforeReason, { pairTitle, pairIndex: index + 1, tier })}
                        ${buildEvidenceSlotHtml(afterItem, 'after', missingAfterReason, { pairTitle, pairIndex: index + 1, tier })}
                    </div>
                </article>
                `;
            }).join('')}
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

export function buildCaseList(root, cards) {
    if (!(root instanceof HTMLElement)) {
        return;
    }

    root.innerHTML = `
        <section class="case-review-panel">
            <p class="case-kicker">SELECT_CASE</p>
            <h1>심사자용 케이스 브리프</h1>
            <p class="case-subtitle">각 케이스는 문제, 원인, 해결, 결과를 먼저 확인하도록 구성됩니다.</p>
            <div class="case-list-grid">
                ${cards.map(({ caseNumber, card, groupTitle }) => `
                    <a
                        class="case-list-card"
                        href="./case-detail.html?case=${caseNumber}"
                        data-track-kind="case_list_card"
                        data-case-number="${caseNumber}"
                        data-case-title="${escapeHtml(card?.title || '')}"
                    >
                        <p class="case-list-id">CASE ${caseNumber}</p>
                        <h2>${escapeHtml(card?.title || '')}</h2>
                        <p>${escapeHtml(groupTitle)}</p>
                    </a>
                `).join('')}
            </div>
        </section>
    `;
}

export function buildCaseDetail(root, cards, selected, options = {}) {
    if (!(root instanceof HTMLElement) || !selected) {
        return;
    }

    const normalizeEvidenceItems = options.normalizeEvidenceItems;
    const buildEvidencePairs = options.buildEvidencePairs;
    const resolveCaseEvidencePairKey = options.resolveCaseEvidencePairKey;
    const normalizeEvidenceLabel = options.normalizeEvidenceLabel;

    const { caseNumber, groupTitle, card } = selected;
    const cardLinks = Array.isArray(card?.links)
        ? card.links.filter((item) => item?.href && parseCaseQueryFromHref(item.href) !== caseNumber)
        : [];
    const caseDocLink = cardLinks.find((item) => isCaseDetailLink(item.href)) || null;
    const referenceLinks = cardLinks.filter((item) => !isCaseDetailLink(item.href));

    const summaryProblem = splitNarrativeLines(card?.problem);
    const summaryCause = splitNarrativeLines(card?.cause);
    const summarySolution = splitNarrativeLines(card?.solution);
    const summaryResult = splitNarrativeLines(card?.result);
    const recruiterSummaryLines = buildRecruiterSummaryLines(
        card,
        summaryProblem,
        summaryCause,
        summarySolution,
        summaryResult
    );

    const coreEvidence = typeof normalizeEvidenceItems === 'function'
        ? normalizeEvidenceItems(card?.evidenceImages, { includeCaption: true, altFromCaption: true })
        : [];
    const extraEvidence = typeof normalizeEvidenceItems === 'function'
        ? normalizeEvidenceItems(card?.extraEvidenceImages, { includeCaption: true, altFromCaption: true })
        : [];
    const corePairCount = typeof buildEvidencePairs === 'function'
        ? buildEvidencePairs(coreEvidence, { pairKeyResolver: resolveCaseEvidencePairKey }).length
        : 0;
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
    if (caseDocLink) {
        const caseDocLabel = String(caseDocLink.label || '케이스 상세 보기').trim() || '케이스 상세 보기';
        referenceButtons.push(`
            <a
                class="case-link-btn case-link-btn-detail"
                href="${escapeHtml(caseDocLink.href)}"
                target="_blank"
                rel="noopener noreferrer"
                data-track-kind="traceability_link"
                data-link-label="${escapeHtml(caseDocLabel)}"
                data-link-role="detail"
            >
                ${escapeHtml(caseDocLabel)}
            </a>
        `);
    }
    referenceLinks.forEach((item) => {
        const label = String(item.label || 'REFERENCE').trim() || 'REFERENCE';
        referenceButtons.push(`
            <a
                class="case-link-btn"
                href="${escapeHtml(item.href)}"
                target="_blank"
                rel="noopener noreferrer"
                data-track-kind="traceability_link"
                data-link-label="${escapeHtml(label)}"
                data-link-role="reference"
            >
                ${escapeHtml(label)}
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
            ${(card?.mermaidId && !card?.hideReviewDiagram) ? `
                <div class="case-review-diagram-area">
                    <p class="section-kicker">ARCHITECTURE_VIEW</p>
                    <div id="case-mermaid-container" class="mermaid" data-mermaid-id="${escapeHtml(card.mermaidId)}"></div>
                </div>
            ` : ''}
            ${recruiterSummaryLines.length > 0 ? `
                <div class="case-recruiter-summary-block">
                    <p class="case-recruiter-kicker">SUMMARY</p>
                    <ul class="case-recruiter-summary-list">
                        ${recruiterSummaryLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            <div class="case-nav-row">
                <a
                    class="case-nav-btn"
                    href="./index.html#${escapeHtml(card?.anchorId || '')}"
                    data-track-kind="case_nav"
                    data-nav-label="BACK_TO_MAIN_CASE_CARD"
                >
                    BACK_TO_MAIN_CASE_CARD
                </a>
                ${prev ? `
                    <a
                        class="case-nav-btn"
                        href="./case-detail.html?case=${prev.caseNumber}"
                        data-track-kind="case_nav"
                        data-nav-label="PREV_CASE_${prev.caseNumber}"
                    >
                        PREV_CASE_${prev.caseNumber}
                    </a>
                ` : ''}
                ${next ? `
                    <a
                        class="case-nav-btn"
                        href="./case-detail.html?case=${next.caseNumber}"
                        data-track-kind="case_nav"
                        data-nav-label="NEXT_CASE_${next.caseNumber}"
                    >
                        NEXT_CASE_${next.caseNumber}
                    </a>
                ` : ''}
            </div>
        </section>

        <section class="case-review-panel">
            <p class="section-kicker">REVIEWER_SUMMARY</p>
            <div class="case-summary-grid">
                ${buildSummaryBlock('문제', summaryProblem)}
                ${buildSummaryBlock('원인', summaryCause)}
                ${buildSummaryBlock('해결', summarySolution)}
                ${buildSummaryBlock('결과', summaryResult)}
            </div>
        </section>

        <section class="case-review-panel">
            <p class="section-kicker">EVIDENCE_AT_A_GLANCE</p>
            <h2>핵심 증거 (Before/After Frame)</h2>
            ${buildEvidencePairsHtml(coreEvidence, 'core', 1, {
                buildEvidencePairs,
                resolveCaseEvidencePairKey,
                normalizeEvidenceLabel
            })}
            <h2 class="case-section-subtitle">보조 증거</h2>
            ${buildEvidencePairsHtml(extraEvidence, 'extra', corePairCount + 1, {
                buildEvidencePairs,
                resolveCaseEvidencePairKey,
                normalizeEvidenceLabel
            })}
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
            <p class="section-kicker">출처</p>
            <h2>원문과 증거 링크</h2>
            <div class="case-link-row">
                ${referenceButtons.join('')}
            </div>
        </section>
    `;
}
