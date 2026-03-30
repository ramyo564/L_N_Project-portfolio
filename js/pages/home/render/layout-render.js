function renderHeroSummaryRows(container, rows) {
    const summaryRows = Array.isArray(rows)
        ? rows.filter((item) => item && (item.label || item.value))
        : [];
    if (summaryRows.length === 0) {
        return false;
    }

    const wrapper = document.createElement('section');
    wrapper.className = 'hero-summary-grid';

    summaryRows.forEach((row) => {
        const item = document.createElement('article');
        item.className = 'hero-summary-row';

        const label = document.createElement('span');
        label.className = 'hero-summary-label';
        label.textContent = row.label || '요약';

        const value = document.createElement('span');
        value.className = 'hero-summary-value';
        value.textContent = row.value || '';

        item.append(label, value);
        wrapper.appendChild(item);
    });

    container.appendChild(wrapper);
    return true;
}

function renderHeroHeadlineItems(container, items) {
    const lines = Array.isArray(items)
        ? items.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
    if (lines.length === 0) {
        return false;
    }

    const grid = document.createElement('section');
    grid.className = 'hero-headline-grid';

    lines.forEach((line) => {
        const item = document.createElement('article');
        item.className = 'hero-headline-item';
        item.textContent = line;
        grid.appendChild(item);
    });

    container.appendChild(grid);
    return true;
}

function renderHeroKpiCards(container, cards) {
    const kpiCards = Array.isArray(cards)
        ? cards.filter((item) => item && (item.label || item.value))
        : [];
    if (kpiCards.length === 0) {
        return false;
    }

    const grid = document.createElement('section');
    grid.className = 'hero-kpi-grid';

    kpiCards.forEach((cardItem) => {
        const card = document.createElement('article');
        card.className = 'hero-kpi-card';

        const label = document.createElement('div');
        label.className = 'hero-kpi-label';
        label.textContent = cardItem.label || '';

        const value = document.createElement('div');
        value.className = 'hero-kpi-value';
        value.textContent = cardItem.value || '';

        card.append(label, value);

        if (cardItem.delta) {
            const delta = document.createElement('div');
            delta.className = 'hero-kpi-delta';
            delta.textContent = cardItem.delta;
            card.appendChild(delta);
        }

        grid.appendChild(card);
    });

    container.appendChild(grid);
    return true;
}

function renderMetricLines(container, lines, fallbackText) {
    const metricLines = Array.isArray(lines) ? lines : [];
    if (metricLines.length === 0) {
        const fallback = document.createElement('p');
        fallback.textContent = fallbackText;
        container.appendChild(fallback);
        return;
    }

    metricLines.forEach((line) => {
        const isObjectLine = line && typeof line === 'object' && !Array.isArray(line);
        const labelText = isObjectLine ? String(line.label ?? '').trim() : '';
        const valueText = isObjectLine ? String(line.value ?? '').trim() : '';
        const plainText = String(isObjectLine ? line.text ?? '' : line ?? '').replace(/^>\s*/, '').trim();

        if (!plainText && !valueText) {
            return;
        }

        const item = document.createElement('p');
        item.className = 'hero-line';

        if (isObjectLine && String(line.kind ?? '').toLowerCase() === 'metric') {
            item.classList.add('is-metric');
        }

        if (labelText && valueText) {
            const label = document.createElement('span');
            label.className = 'hero-line-label';
            label.textContent = `${labelText}:`;

            const value = document.createElement('span');
            value.className = 'hero-line-value';
            value.textContent = valueText;

            item.append(label, value);
        } else {
            item.textContent = isObjectLine ? plainText : `> ${plainText}`;
        }

        container.appendChild(item);
    });
}

function createTopPanel(panel, index) {
    const section = document.createElement('section');
    section.className = `panel hero-panel ${panel.panelClass ?? ''}`.trim();
    section.id = panel.sectionId || `top-panel-${index + 1}`;

    const header = document.createElement('div');
    header.className = 'panel-header';

    const title = document.createElement('span');
    title.className = 'panel-title';
    title.textContent = panel.panelTitle || `TOP_PANEL_${index + 1}`;

    const uid = document.createElement('span');
    uid.className = 'panel-uid';
    uid.textContent = panel.panelUid || `ID: TOP-${String(index + 1).padStart(2, '0')}`;

    header.append(title, uid);

    const graphContainer = document.createElement('div');
    graphContainer.className = 'graph-container';
    const mermaidContainer = document.createElement('div');
    mermaidContainer.className = 'mermaid';
    mermaidContainer.setAttribute('data-mermaid-id', panel.diagramId || '');
    graphContainer.appendChild(mermaidContainer);

    const metrics = document.createElement('div');
    metrics.className = 'hero-message';
    renderMetricLines(metrics, panel.metrics, '> Add metrics in templateConfig.topPanels');

    section.append(header, graphContainer, metrics);
    return section;
}

export function renderHero({
    templateConfig,
    byId,
    setText,
    trackSelectContent,
    getOpenK6OverviewModal
} = {}) {
    const hero = templateConfig?.hero ?? {};
    const section = byId?.('system-architecture');
    const metrics = byId?.('hero-metrics');
    const mermaidContainer = byId?.('hero-mermaid');

    if (section && hero.sectionId) {
        section.id = hero.sectionId;
    }
    setText?.('hero-panel-title', hero.panelTitle);
    setText?.('hero-panel-uid', hero.panelUid);

    if (mermaidContainer && hero.diagramId) {
        mermaidContainer.setAttribute('data-mermaid-id', hero.diagramId);
    }

    if (!metrics) {
        return;
    }
    metrics.replaceChildren();
    const headline = String(hero.headline || '').trim();
    if (headline) {
        const headlineNode = document.createElement('div');
        headlineNode.className = 'hero-headline';
        headlineNode.textContent = headline;
        metrics.appendChild(headlineNode);
    }
    const hasHeadlineItems = renderHeroHeadlineItems(metrics, hero.headlineItems);

    const hasSummaryRows = renderHeroSummaryRows(metrics, hero.summaryRows);
    const hasKpiCards = renderHeroKpiCards(metrics, hero.kpiCards);
    if (!headline && !hasHeadlineItems && !hasSummaryRows && !hasKpiCards) {
        renderMetricLines(metrics, hero.metrics, '> Add metrics in templateConfig.hero.metrics');
    }

    if (!section) {
        return;
    }

    let diagramNote = section.querySelector('.hero-diagram-note');
    const diagramNoteText = String(hero.diagramNote || '').trim();
    if (diagramNoteText) {
        if (!(diagramNote instanceof HTMLElement)) {
            diagramNote = document.createElement('div');
            diagramNote.className = 'hero-diagram-note';
            section.appendChild(diagramNote);
        }
        diagramNote.textContent = diagramNoteText;
    } else if (diagramNote instanceof HTMLElement) {
        diagramNote.remove();
    }

    let actions = section.querySelector('.hero-actions');
    if (!(actions instanceof HTMLElement)) {
        actions = document.createElement('div');
        actions.className = 'hero-actions';
        section.appendChild(actions);
    }

    actions.replaceChildren();
    if (hero.k6Overview) {
        const button = document.createElement('button');
        button.className = 'hero-action-btn';
        button.type = 'button';
        button.textContent = hero.k6ButtonLabel || 'K6_TEST_ENVIRONMENT';
        button.setAttribute('aria-haspopup', 'dialog');
        button.addEventListener('click', () => {
            const openK6OverviewModal = typeof getOpenK6OverviewModal === 'function'
                ? getOpenK6OverviewModal()
                : null;
            if (typeof openK6OverviewModal === 'function') {
                openK6OverviewModal(hero.k6Overview, hero.k6ButtonLabel || 'K6_TEST_ENVIRONMENT');
            }

            trackSelectContent?.({
                contentType: 'hero_action',
                itemId: 'k6_test_environment',
                itemName: hero.k6ButtonLabel || 'K6_TEST_ENVIRONMENT',
                sectionName: 'hero',
                interactionAction: 'open_modal',
                elementType: 'button',
                elementLabel: hero.k6ButtonLabel || 'K6_TEST_ENVIRONMENT',
                modalName: 'k6_overview_modal'
            });
        });
        actions.appendChild(button);
    }

    if (actions.childElementCount === 0) {
        actions.remove();
    }
}

export function renderTopPanels({ templateConfig, byId } = {}) {
    const container = byId?.('top-panels');
    if (!container) {
        return;
    }
    container.replaceChildren();

    const panels = Array.isArray(templateConfig?.topPanels) ? templateConfig.topPanels : [];
    panels.forEach((panel, index) => {
        container.appendChild(createTopPanel(panel, index));
    });
}

export function renderSkills({ templateConfig, byId, setText } = {}) {
    const skillsConfig = templateConfig?.skills ?? {};
    const section = byId?.('skill-set');
    const grid = byId?.('skill-grid');
    if (!grid) {
        return;
    }

    if (section && skillsConfig.sectionId) {
        section.id = skillsConfig.sectionId;
    }
    setText?.('skills-panel-title', skillsConfig.panelTitle);
    setText?.('skills-panel-uid', skillsConfig.panelUid);

    grid.replaceChildren();
    const items = Array.isArray(skillsConfig.items) ? skillsConfig.items : [];

    items.forEach((item) => {
        const card = document.createElement('article');
        card.className = 'skill-card';

        const title = document.createElement('h3');
        title.className = 'skill-card-title';
        title.textContent = item.title ?? 'CATEGORY';

        const stack = document.createElement('p');
        stack.className = 'skill-card-stack';
        stack.textContent = item.stack ?? '';

        card.append(title, stack);
        grid.appendChild(card);
    });
}

export function renderContact({
    templateConfig,
    byId,
    setText,
    detectLinkType,
    trackSelectContent
} = {}) {
    const contact = templateConfig?.contact ?? {};
    const section = byId?.('contact');
    const actions = byId?.('contact-actions');

    if (section && contact.sectionId) {
        section.id = contact.sectionId;
    }
    setText?.('contact-panel-title', contact.panelTitle);
    setText?.('contact-panel-uid', contact.panelUid);
    setText?.('contact-description', contact.description);

    if (!actions) {
        return;
    }
    actions.replaceChildren();

    const items = Array.isArray(contact.actions) ? contact.actions : [];
    items.forEach((item) => {
        const action = document.createElement('a');
        action.className = 'action-btn';
        action.href = item.href || '#';
        action.textContent = item.label || 'LINK';
        const actionHref = item.href || '#';
        if (!String(item.href || '').startsWith('mailto:')) {
            action.target = '_blank';
            action.rel = 'noopener noreferrer';
        }

        action.addEventListener('click', () => {
            trackSelectContent?.({
                contentType: 'contact_action',
                itemId: item.label || 'unknown_contact_action',
                itemName: item.label || 'LINK',
                sectionName: 'contact',
                interactionAction: 'open_link',
                elementType: 'link',
                elementLabel: item.label || 'LINK',
                linkUrl: actionHref,
                linkType: detectLinkType?.(actionHref)
            });
        });
        actions.appendChild(action);
    });
}

export function buildDefaultNavigation({ templateConfig, normalizeHashTarget } = {}) {
    const items = [];

    const hero = templateConfig?.hero ?? {};
    const skills = templateConfig?.skills ?? {};
    const contact = templateConfig?.contact ?? {};

    items.push({
        label: hero.panelTitle || 'SYSTEM_ARCHITECTURE',
        target: normalizeHashTarget?.(hero.sectionId || 'system-architecture')
    });

    const topPanels = Array.isArray(templateConfig?.topPanels) ? templateConfig.topPanels : [];
    topPanels.forEach((panel, index) => {
        items.push({
            label: panel.navLabel || panel.panelTitle || `TOP_PANEL_${index + 1}`,
            target: normalizeHashTarget?.(panel.sectionId || `top-panel-${index + 1}`)
        });
    });

    items.push({
        label: skills.panelTitle || 'SKILL_SET',
        target: normalizeHashTarget?.(skills.sectionId || 'skill-set')
    });

    const serviceSections = Array.isArray(templateConfig?.serviceSections) ? templateConfig.serviceSections : [];
    serviceSections.forEach((section) => {
        items.push({
            label: section.navLabel || section.title || section.id || 'SERVICES',
            target: normalizeHashTarget?.(section.id || '')
        });
    });

    items.push({
        label: contact.panelTitle || 'CONTACT',
        target: normalizeHashTarget?.(contact.sectionId || 'contact')
    });

    return items;
}

export function buildCaseNavigationItems({ templateConfig, normalizeHashTarget, casesTarget } = {}) {
    const normalizedCasesTarget = normalizeHashTarget?.(casesTarget || 'cases');
    const sections = Array.isArray(templateConfig?.serviceSections) ? templateConfig.serviceSections : [];
    const casesSection = sections.find((section) => normalizeHashTarget?.(section.id || '') === normalizedCasesTarget);
    if (!casesSection) {
        return [];
    }

    const groups = Array.isArray(casesSection.groups) && casesSection.groups.length > 0
        ? casesSection.groups
        : [{ cards: casesSection.cards ?? [] }];

    const caseItems = [];
    let sequence = 1;
    groups.forEach((group) => {
        const cards = Array.isArray(group.cards) ? group.cards : [];
        cards.forEach((card) => {
            if (!card?.title) {
                return;
            }
            const anchorId = String(card.anchorId || '').trim();
            if (!anchorId) {
                return;
            }
            caseItems.push({
                label: card.title || `Case ${sequence}`,
                target: normalizeHashTarget?.(anchorId)
            });
            sequence += 1;
        });
    });

    return caseItems;
}

export function renderNavigation({
    templateConfig,
    byId,
    normalizeHashTarget,
    detectLinkType,
    trackSelectContent
} = {}) {
    const nav = byId?.('header-nav');
    if (!nav) {
        return;
    }
    nav.replaceChildren();

    const configuredNav = Array.isArray(templateConfig?.navigation) && templateConfig.navigation.length > 0
        ? templateConfig.navigation
        : buildDefaultNavigation({ templateConfig, normalizeHashTarget });

    configuredNav.forEach((item) => {
        const normalizedTarget = normalizeHashTarget?.(item.target);
        const label = String(item.label || '');
        const isCasesMenu = Boolean(item.caseMenu) || label.toUpperCase().includes('CASE');
        const caseItems = isCasesMenu
            ? buildCaseNavigationItems({ templateConfig, normalizeHashTarget, casesTarget: normalizedTarget })
            : [];
        if (caseItems.length > 0) {
            const wrap = document.createElement('div');
            wrap.className = 'nav-item-wrap has-submenu';

            const parent = document.createElement('a');
            parent.className = 'nav-item nav-parent';
            parent.href = normalizedTarget;
            parent.textContent = item.label || 'CASES';
            parent.addEventListener('click', () => {
                trackSelectContent?.({
                    contentType: 'navigation',
                    itemId: normalizedTarget.replace(/^#/, '') || 'unknown_target',
                    itemName: parent.textContent || 'CASES',
                    sectionName: 'header_nav',
                    interactionAction: 'navigate',
                    elementType: 'nav_link',
                    elementLabel: parent.textContent || 'CASES',
                    linkUrl: normalizedTarget,
                    linkType: detectLinkType?.(normalizedTarget)
                });
            });
            wrap.appendChild(parent);

            const submenu = document.createElement('div');
            submenu.className = 'nav-submenu';
            caseItems.forEach((caseItem) => {
                const subLink = document.createElement('a');
                subLink.className = 'nav-sub-item';
                subLink.href = normalizeHashTarget?.(caseItem.target);
                subLink.textContent = caseItem.label || 'CASE';
                subLink.addEventListener('click', () => {
                    const target = normalizeHashTarget?.(caseItem.target);
                    const targetId = target.replace(/^#/, '');
                    trackSelectContent?.({
                        contentType: 'navigation_case',
                        itemId: targetId || 'unknown_case_target',
                        itemName: caseItem.label || 'CASE',
                        sectionName: 'header_nav',
                        interactionAction: 'navigate',
                        elementType: 'nav_sub_link',
                        elementLabel: caseItem.label || 'CASE',
                        linkUrl: target,
                        linkType: detectLinkType?.(target)
                    });
                });
                submenu.appendChild(subLink);
            });

            wrap.append(submenu);
            nav.appendChild(wrap);
            return;
        }

        const link = document.createElement('a');
        link.className = 'nav-item';
        link.href = normalizedTarget;
        link.textContent = item.label || 'SECTION';
        link.addEventListener('click', () => {
            trackSelectContent?.({
                contentType: 'navigation',
                itemId: normalizedTarget.replace(/^#/, '') || 'unknown_target',
                itemName: item.label || 'SECTION',
                sectionName: 'header_nav',
                interactionAction: 'navigate',
                elementType: 'nav_link',
                elementLabel: item.label || 'SECTION',
                linkUrl: normalizedTarget,
                linkType: detectLinkType?.(normalizedTarget)
            });
        });
        nav.appendChild(link);
    });
}
