function createGroupDivider(group, sectionTheme) {
    const divider = document.createElement('div');
    divider.className = 'group-divider';
    divider.setAttribute('data-theme', sectionTheme || 'blue');

    const title = document.createElement('span');
    title.className = 'group-title';
    title.textContent = group.title ?? '';

    const desc = document.createElement('span');
    desc.className = 'group-desc';
    desc.textContent = group.desc ?? '';

    divider.append(title, desc);
    return divider;
}

function createMetaLine(label, value) {
    if (!value) {
        return null;
    }

    const line = document.createElement('p');
    line.className = 'card-meta-line';

    const key = document.createElement('span');
    key.className = 'meta-label';
    key.textContent = `${label}:`;

    const text = document.createElement('span');
    text.className = 'meta-value';
    text.textContent = value;

    line.append(key, text);
    return line;
}

function extractFirstLineSummary(content) {
    if (!content) {
        return '';
    }

    const lines = String(content)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    for (const line of lines) {
        const cleaned = line
            .replace(/^\d+\)\s*/, '')
            .replace(/^[-*]\s*/, '')
            .replace(/\s+/g, ' ')
            .trim();
        if (cleaned) {
            return cleaned;
        }
    }

    return '';
}

function createScanSummary(card) {
    const rows = [
        { label: 'PROBLEM', value: extractFirstLineSummary(card.problem || card.cause) },
        { label: 'ACTION', value: extractFirstLineSummary(card.solution) },
        { label: 'IMPACT', value: extractFirstLineSummary(card.result) }
    ].filter((item) => item.value);

    if (rows.length === 0) {
        return null;
    }

    const wrapper = document.createElement('section');
    wrapper.className = 'card-scan-summary';

    rows.forEach((item) => {
        const line = document.createElement('p');
        line.className = 'card-scan-row';

        const key = document.createElement('span');
        key.className = 'card-scan-key';
        key.textContent = item.label;

        const value = document.createElement('span');
        value.className = 'card-scan-value';
        value.textContent = item.value;

        line.append(key, value);
        wrapper.appendChild(line);
    });

    return wrapper;
}

function createRecruiterCardSummary(card) {
    const explicitLines = Array.isArray(card?.recruiterSummary)
        ? card.recruiterSummary.map((line) => String(line || '').trim()).filter(Boolean)
        : [];

    const fallbackLines = [
        extractFirstLineSummary(card?.overview || card?.description),
        extractFirstLineSummary(card?.result)
    ].filter(Boolean);

    const lines = (explicitLines.length > 0 ? explicitLines : fallbackLines).slice(0, 3);
    if (lines.length === 0) {
        return null;
    }

    const wrapper = document.createElement('section');
    wrapper.className = 'card-recruiter-summary';

    const kicker = document.createElement('p');
    kicker.className = 'card-recruiter-kicker';
    kicker.textContent = 'SUMMARY';

    const list = document.createElement('ul');
    list.className = 'card-recruiter-list';
    lines.forEach((line) => {
        const item = document.createElement('li');
        item.textContent = line;
        list.appendChild(item);
    });

    wrapper.append(kicker, list);
    return wrapper;
}

function createSectionRecruiterBrief(sectionConfig, options = {}) {
    const brief = sectionConfig?.recruiterBrief;
    if (!brief || typeof brief !== 'object') {
        return null;
    }

    const trackSelectContent = options.trackSelectContent;
    const revealHashTarget = options.revealHashTarget;

    const quickCases = Array.isArray(brief.cases)
        ? brief.cases
            .map((item) => ({
                id: String(item?.id || '').trim(),
                anchorId: String(item?.anchorId || '').trim(),
                title: String(item?.title || '').trim(),
                problem: String(item?.problem || '').trim(),
                action: String(item?.action || '').trim(),
                impact: String(item?.impact || '').trim(),
                links: item?.links || []
            }))
            .filter((item) => item.id || item.title || item.problem || item.action || item.impact)
        : [];

    const bullets = Array.isArray(brief.bullets)
        ? brief.bullets.map((line) => String(line || '').trim()).filter(Boolean)
        : [];

    if (!brief.title && bullets.length === 0 && quickCases.length === 0) {
        return null;
    }

    const wrapper = document.createElement('section');
    wrapper.className = 'section-recruiter-brief';

    const kickerText = String(brief.kicker || '').trim();
    if (kickerText) {
        const kicker = document.createElement('p');
        kicker.className = 'section-recruiter-kicker';
        kicker.textContent = kickerText;
        wrapper.appendChild(kicker);
    }

    const titleText = String(brief.title || '').trim();
    if (titleText) {
        const title = document.createElement('h3');
        title.className = 'section-recruiter-title';
        title.textContent = titleText;
        wrapper.appendChild(title);
    }

    if (quickCases.length > 0) {
        const cardGrid = document.createElement('div');
        cardGrid.className = 'section-recruiter-card-grid';

        quickCases.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'section-recruiter-card';
            if (item.anchorId) {
                card.id = `brief-${item.anchorId.replace(/^#/, '')}`;
            }

            const header = document.createElement('div');
            header.className = 'section-recruiter-card-header';
            header.style.cursor = 'pointer';

            const idLine = document.createElement('p');
            idLine.className = 'section-recruiter-card-id';
            idLine.textContent = item.id || 'Case';

            const cardTitle = document.createElement('h4');
            cardTitle.className = 'section-recruiter-card-title';
            cardTitle.textContent = item.title || '핵심 변화';

            header.append(idLine, cardTitle);

            const toggleHint = document.createElement('div');
            toggleHint.className = 'section-recruiter-card-toggle-hint';
            toggleHint.textContent = 'DETAILS';
            header.appendChild(toggleHint);

            const details = document.createElement('div');
            details.className = 'section-recruiter-card-details';

            const createRow = (labelText, valueText) => {
                if (!valueText) {
                    return null;
                }
                const row = document.createElement('p');
                row.className = 'section-recruiter-card-row';
                row.style.marginBottom = '0.4rem';

                const label = document.createElement('span');
                label.className = 'section-recruiter-card-key';
                label.style.display = 'block';
                label.style.fontWeight = 'bold';
                label.style.color = 'var(--accent-orange)';
                label.style.fontSize = '0.65rem';
                label.textContent = labelText;

                const value = document.createElement('span');
                value.className = 'section-recruiter-card-value';
                value.style.fontSize = '0.78rem';
                value.style.color = 'var(--text-secondary)';
                value.textContent = valueText;

                row.append(label, value);
                return row;
            };

            const problemRow = createRow('PROBLEM', item.problem);
            const actionRow = createRow('ACTION', item.action);
            const impactRow = createRow('IMPACT', item.impact);

            if (problemRow) details.appendChild(problemRow);
            if (actionRow) details.appendChild(actionRow);
            if (impactRow) details.appendChild(impactRow);

            if (Array.isArray(item.links)) {
                item.links.forEach((linkInfo) => {
                    if (!linkInfo.href) {
                        return;
                    }
                    const btn = document.createElement('a');
                    btn.className = 'card-extra-btn';
                    btn.style.display = 'block';
                    btn.style.width = '100%';
                    btn.style.marginTop = '0.8rem';
                    btn.style.textAlign = 'center';
                    btn.href = linkInfo.href;
                    btn.target = '_blank';
                    btn.rel = 'noopener noreferrer';
                    btn.textContent = linkInfo.label || 'GO TO PAGE';
                    btn.addEventListener('click', () => {
                        trackSelectContent?.({
                            contentType: 'recruiter_brief_link',
                            itemId: item.id || 'brief_case',
                            itemName: item.title || 'Brief Case',
                            sectionName: 'recruiter_brief',
                            interactionAction: 'open_link',
                            elementType: 'link',
                            elementLabel: linkInfo.label || 'LINK',
                            linkUrl: linkInfo.href
                        });
                    });
                    details.appendChild(btn);
                });
            }

            if (item.anchorId) {
                const gotoBtn = document.createElement('button');
                gotoBtn.className = 'card-extra-btn';
                gotoBtn.style.marginTop = '0.8rem';
                gotoBtn.style.width = '100%';
                gotoBtn.textContent = 'GO_TO_FULL_PROBLEM_SOLVING';

                gotoBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const targetId = item.anchorId.replace(/^#/, '');
                    revealHashTarget?.(targetId, 'recruiter_card_goto');
                });
                details.appendChild(gotoBtn);
            }

            card.append(header, details);

            card.addEventListener('click', () => {
                const isExpanded = card.classList.toggle('is-expanded');
                trackSelectContent?.({
                    contentType: 'recruiter_quick_brief_card',
                    itemId: item.id || 'unknown_case',
                    itemName: item.title || 'unknown_case',
                    sectionName: 'recruiter_quick_brief',
                    interactionAction: isExpanded ? 'expand' : 'collapse',
                    elementType: 'article',
                    elementLabel: item.id || 'unknown_case'
                });
            });

            cardGrid.appendChild(card);
        });

        wrapper.appendChild(cardGrid);
    }

    if (bullets.length > 0 && quickCases.length === 0) {
        const list = document.createElement('ul');
        list.className = 'section-recruiter-list';
        bullets.forEach((line) => {
            const item = document.createElement('li');
            item.textContent = line;
            list.appendChild(item);
        });
        wrapper.appendChild(list);
    }

    const actions = document.createElement('div');
    actions.className = 'section-recruiter-actions';
    wrapper.appendChild(actions);

    return wrapper;
}

function createEvidenceGallery(items, caseTitle, options = {}) {
    const normalizeEvidenceItems = options.normalizeEvidenceItems;
    const getOpenExtraEvidenceModal = options.getOpenExtraEvidenceModal;
    const trackSelectContent = options.trackSelectContent;

    const normalizedItems = normalizeEvidenceItems?.(items) || [];
    if (normalizedItems.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-evidence';

    const title = document.createElement('h4');
    title.className = 'card-evidence-title';
    title.textContent = '성능 증거 (k6)';

    const grid = document.createElement('div');
    grid.className = 'card-evidence-grid';

    normalizedItems.forEach((item) => {
        const trigger = document.createElement('button');
        trigger.className = 'card-evidence-item';
        trigger.type = 'button';
        trigger.setAttribute('aria-label', `${caseTitle || 'case'} performance evidence ${item.label}`);

        const image = document.createElement('img');
        image.src = item.src;
        image.alt = item.alt;
        image.loading = 'lazy';

        const caption = document.createElement('span');
        caption.className = 'card-evidence-caption';
        caption.textContent = item.label || 'EVIDENCE';

        trigger.append(image, caption);
        trigger.addEventListener('click', () => {
            const openExtraEvidenceModal = typeof getOpenExtraEvidenceModal === 'function'
                ? getOpenExtraEvidenceModal()
                : null;
            if (typeof openExtraEvidenceModal === 'function') {
                openExtraEvidenceModal(
                    normalizedItems,
                    `${caseTitle || 'Case'} · 성능 증거`,
                    {
                        initialSrc: item.src,
                        source: 'performance_evidence_grid',
                        caseId: caseTitle || 'unknown_case'
                    }
                );
            } else {
                window.open(item.src, '_blank', 'noopener,noreferrer');
            }

            trackSelectContent?.({
                contentType: 'performance_evidence',
                itemId: caseTitle || 'unknown_case',
                itemName: item.label || 'unknown_evidence',
                sectionName: 'case_card',
                interactionAction: 'click_thumbnail',
                elementType: 'button',
                elementLabel: item.label || 'unknown_evidence',
                modalName: 'extra_evidence_modal',
                evidence_phase: item.phase || 'unknown'
            });
        });
        grid.appendChild(trigger);
    });

    wrapper.append(title, grid);
    return wrapper;
}

function createExtraEvidenceButton(items, caseTitle, options = {}) {
    const normalizeEvidenceItems = options.normalizeEvidenceItems;
    const getOpenExtraEvidenceModal = options.getOpenExtraEvidenceModal;
    const trackSelectContent = options.trackSelectContent;

    const normalizedItems = normalizeEvidenceItems?.(items) || [];
    if (normalizedItems.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-extra-actions';

    const button = document.createElement('button');
    button.className = 'card-extra-btn';
    button.type = 'button';
    button.textContent = `보조 이미지 (${normalizedItems.length})`;
    button.setAttribute('aria-label', `${caseTitle || 'case'} 보조 이미지`);

    button.addEventListener('click', () => {
        const openExtraEvidenceModal = typeof getOpenExtraEvidenceModal === 'function'
            ? getOpenExtraEvidenceModal()
            : null;
        if (typeof openExtraEvidenceModal === 'function') {
            openExtraEvidenceModal(
                normalizedItems,
                `${caseTitle || '보조 이미지'} · 보조 이미지`,
                {
                    source: 'extra_images_button',
                    caseId: caseTitle || 'unknown_case'
                }
            );
        }

        trackSelectContent?.({
            contentType: 'extra_evidence_button',
            itemId: caseTitle || 'unknown_case',
            sectionName: 'case_card',
            interactionAction: 'click',
            elementType: 'button',
            elementLabel: 'EXTRA_IMAGES',
            modalName: 'extra_evidence_modal',
            value: normalizedItems.length
        });
    });

    wrapper.appendChild(button);
    return wrapper;
}

function createK6ComparisonButton(card, options = {}) {
    const getOpenK6OverviewModal = options.getOpenK6OverviewModal;
    const heroConfig = options.heroConfig;
    const trackSelectContent = options.trackSelectContent;

    const button = document.createElement('button');
    button.className = 'card-extra-btn is-highlight';
    button.type = 'button';
    button.textContent = card.k6ComparisonLabel || '성능 비교 : 500VU BEFORE/CURRENT';
    button.style.marginLeft = '0.5rem';

    button.addEventListener('click', () => {
        const openK6OverviewModal = typeof getOpenK6OverviewModal === 'function'
            ? getOpenK6OverviewModal()
            : null;
        if (typeof openK6OverviewModal === 'function') {
            openK6OverviewModal(heroConfig?.k6Overview, card.k6ComparisonLabel || 'K6_TEST_ENVIRONMENT_OVERVIEW');
        }

        trackSelectContent?.({
            contentType: 'k6_comparison_button',
            itemId: card.title || 'unknown_case',
            sectionName: 'case_card',
            interactionAction: 'click',
            elementType: 'button',
            elementLabel: 'K6_COMPARISON',
            modalName: 'k6_overview_modal'
        });
    });

    return button;
}

function createCardLinks(card, options = {}) {
    const toCaseReviewLink = options.toCaseReviewLink;
    const getOpenK6OverviewModal = options.getOpenK6OverviewModal;
    const heroConfig = options.heroConfig;
    const trackSelectContent = options.trackSelectContent;
    const detectLinkType = options.detectLinkType;

    const links = Array.isArray(card.links) ? card.links.filter((item) => item?.href) : [];
    if (links.length === 0 && card.learnMore && card.learnMore !== '#') {
        links.push({ label: card.linkLabel ?? 'LEARN MORE', href: card.learnMore });
    }

    if (links.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-links';

    links.forEach((item) => {
        const originalHref = String(item.href || '');
        const resolvedHref = toCaseReviewLink?.(originalHref) || originalHref;
        const isCaseReviewLink = resolvedHref !== originalHref || originalHref.includes('case-detail.html?case=');
        const linkText = isCaseReviewLink
            ? (item.label || '케이스 상세 보기')
            : (item.label || 'LINK');
        const link = document.createElement('a');
        link.className = 'card-link';
        if (isCaseReviewLink) {
            link.classList.add('case-review-link');
        }
        link.href = resolvedHref;
        link.textContent = linkText;
        if (!String(resolvedHref).startsWith('mailto:')) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }

        link.addEventListener('click', (event) => {
            if (originalHref === '#k6-overview') {
                event.preventDefault();
                const openK6OverviewModal = typeof getOpenK6OverviewModal === 'function'
                    ? getOpenK6OverviewModal()
                    : null;
                if (typeof openK6OverviewModal === 'function') {
                    openK6OverviewModal(heroConfig?.k6Overview, item.label || 'K6_TEST_ENVIRONMENT');
                }
            }

            trackSelectContent?.({
                contentType: 'case_link',
                itemId: card.title || 'unknown_case',
                itemName: item.label || 'LINK',
                sectionName: 'case_card',
                interactionAction: 'open_link',
                elementType: 'link',
                elementLabel: linkText,
                linkUrl: resolvedHref,
                linkType: detectLinkType?.(resolvedHref),
                source_link_url: isCaseReviewLink ? originalHref : ''
            });
        });

        wrapper.appendChild(link);
    });

    return wrapper;
}

function createServiceCard(card, sectionConfig, options = {}) {
    const article = document.createElement('article');
    article.className = `service-card ${sectionConfig.cardClass ?? ''} ${card.cardClass ?? ''}`.trim();
    if (card.anchorId) {
        article.id = card.anchorId;
    }

    const visual = document.createElement('div');
    visual.className = 'card-visual';
    const visualHeight = card.visualHeight || sectionConfig.cardVisualHeight;
    if (visualHeight) {
        visual.style.setProperty('--card-visual-height', visualHeight);
    }

    const mermaidContainer = document.createElement('div');
    mermaidContainer.className = 'mermaid';
    mermaidContainer.setAttribute('data-mermaid-id', card.mermaidId ?? '');
    visual.appendChild(mermaidContainer);

    const content = document.createElement('div');
    content.className = 'card-content';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = card.title ?? 'Card Title';

    const subtitleText = card.subtitle ?? card.period ?? '';
    const subtitle = document.createElement('p');
    subtitle.className = 'card-subtitle';
    subtitle.textContent = subtitleText;

    const description = document.createElement('p');
    description.className = 'card-desc';
    const overviewText = card.overview ?? card.description ?? '';
    description.textContent = overviewText;

    const recruiterSummary = createRecruiterCardSummary(card);
    const stackLine = createMetaLine('TECH_DETAIL', card.stackSummary);
    const scanSummary = createScanSummary(card);
    const evidenceGallery = createEvidenceGallery(card.evidenceImages, card.title, options);
    const extraEvidenceButton = createExtraEvidenceButton(card.extraEvidenceImages, card.title, options);
    const links = createCardLinks(card, options);

    content.append(title);
    if (subtitleText) {
        content.append(subtitle);
    }
    if (card.businessImpact) {
        const impact = document.createElement('p');
        impact.className = 'card-business-impact';
        impact.innerHTML = '<strong>🎯 비즈니스 임팩트:</strong> ' + card.businessImpact;
        content.append(impact);
    }
    content.append(description);
    if (recruiterSummary) {
        content.append(recruiterSummary);
    }
    if (stackLine) {
        content.append(stackLine);
    }
    if (scanSummary) {
        content.append(scanSummary);
    }
    if (evidenceGallery) {
        content.append(evidenceGallery);
    }
    
    if (extraEvidenceButton || card.showK6Comparison) {
        const extraWrapper = extraEvidenceButton || document.createElement('div');
        if (!extraEvidenceButton) {
            extraWrapper.className = 'card-extra-actions';
        }
        
        if (card.showK6Comparison) {
            const k6Btn = createK6ComparisonButton(card, options);
            if (k6Btn) {
                // If there's already a button in the wrapper, add some margin
                if (extraWrapper.children.length > 0) {
                    k6Btn.style.marginLeft = '0.6rem';
                } else {
                    k6Btn.style.marginLeft = '0';
                }
                extraWrapper.appendChild(k6Btn);
            }
        }
        content.append(extraWrapper);
    }
    if (links) {
        content.append(links);
    }
    article.append(visual, content);
    return article;
}

export function renderServiceSections({
    templateConfig,
    byId,
    trackSelectContent,
    detectLinkType,
    normalizeEvidenceItems,
    toCaseReviewLink,
    getOpenExtraEvidenceModal,
    getOpenK6OverviewModal,
    revealHashTarget
} = {}) {
    const container = byId?.('service-sections');
    if (!container) {
        return;
    }
    container.replaceChildren();

    const sections = Array.isArray(templateConfig?.serviceSections) ? templateConfig.serviceSections : [];
    sections.forEach((sectionConfig) => {
        const sectionWrapper = document.createElement('section');
        sectionWrapper.className = 'service-section';
        sectionWrapper.id = sectionConfig.id ?? '';

        const header = document.createElement('div');
        header.className = 'section-header';

        const headingWrap = document.createElement('div');
        headingWrap.className = 'section-header-main';

        const heading = document.createElement('h2');
        heading.className = 'section-title';
        heading.textContent = sectionConfig.title ?? 'SERVICES';
        headingWrap.appendChild(heading);

        const sectionLeadText = String(sectionConfig.sectionLead || '').trim();
        if (sectionLeadText) {
            const sectionLead = document.createElement('p');
            sectionLead.className = 'section-lead';
            sectionLead.textContent = sectionLeadText;
            headingWrap.appendChild(sectionLead);
        }
        header.appendChild(headingWrap);

        const groupsContainer = document.createElement('div');
        groupsContainer.className = 'service-groups';
        const recruiterBrief = createSectionRecruiterBrief(sectionConfig, {
            trackSelectContent,
            revealHashTarget
        });
        const groups = Array.isArray(sectionConfig.groups) && sectionConfig.groups.length > 0
            ? sectionConfig.groups
            : [{ title: '', desc: '', cards: sectionConfig.cards ?? [] }];

        groups.forEach((group) => {
            const groupSection = document.createElement('div');
            groupSection.className = 'service-group';

            if (group.title || group.desc) {
                groupSection.appendChild(createGroupDivider(group, sectionConfig.theme));
            }

            const groupGrid = document.createElement('div');
            groupGrid.className = 'service-grid';

            const cards = Array.isArray(group.cards) ? group.cards : [];
            cards.forEach((card) => {
                const cardElement = createServiceCard(card, sectionConfig, {
                    normalizeEvidenceItems,
                    getOpenExtraEvidenceModal,
                    getOpenK6OverviewModal,
                    heroConfig: templateConfig?.hero,
                    trackSelectContent,
                    detectLinkType,
                    toCaseReviewLink
                });
                groupGrid.appendChild(cardElement);
            });

            groupSection.appendChild(groupGrid);
            groupsContainer.appendChild(groupSection);
        });

        sectionWrapper.append(header);
        if (recruiterBrief) {
            sectionWrapper.appendChild(recruiterBrief);
        }
        sectionWrapper.appendChild(groupsContainer);
        container.appendChild(sectionWrapper);
    });
}

export function buildRevealHashTarget({ byId, trackSelectContent } = {}) {
    return function revealHashTarget(hashValue, triggerSource = 'hash_navigation') {
        const targetId = String(hashValue || '').replace(/^#/, '').trim();
        if (!targetId) {
            return;
        }

        window.setTimeout(() => {
            const target = byId?.(targetId) || byId?.(`brief-${targetId}`);
            if (!target) {
                return;
            }
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });

            target.classList.remove('is-target-highlight');
            void target.offsetWidth;
            target.classList.add('is-target-highlight');

            if (target.classList.contains('section-recruiter-card')) {
                target.classList.add('is-expanded');
            }

            const showcaseId = target.closest('.service-section')?.id || '';
            trackSelectContent?.({
                contentType: 'hash_target_reveal',
                itemId: targetId,
                itemName: target.querySelector('.card-title, .section-recruiter-card-title')?.textContent?.trim() || targetId,
                sectionName: 'service_section',
                interactionAction: 'reveal_target',
                elementType: 'section',
                elementLabel: 'HASH_TARGET_REVEAL',
                trigger_source: triggerSource,
                showcase_id: showcaseId
            });
        }, 100);
    };
}
