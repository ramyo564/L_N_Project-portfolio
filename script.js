import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
import { templateConfig } from './config.js';

const baseMermaidConfig = {
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'linear'
    }
};

const mermaidConfig = {
    ...baseMermaidConfig,
    ...(templateConfig.mermaid ?? {}),
    flowchart: {
        ...baseMermaidConfig.flowchart,
        ...(templateConfig.mermaid?.flowchart ?? {})
    }
};

mermaid.initialize(mermaidConfig);

function byId(id) {
    return document.getElementById(id);
}

function normalizeHashTarget(target) {
    if (!target) {
        return '#';
    }
    return target.startsWith('#') ? target : `#${target}`;
}

function toSafeLabel(value) {
    return String(value ?? 'unknown').replace(/[^a-zA-Z0-9_-]+/g, ' ').trim() || 'unknown';
}

function setText(id, value) {
    const el = byId(id);
    if (el && value) {
        el.textContent = value;
    }
}

function syncModalBodyLock() {
    const hasOpenModal = Boolean(document.querySelector('.mermaid-modal.is-open, .extra-evidence-modal.is-open'));
    document.body.classList.toggle('modal-open', hasOpenModal);
}

function setupUptime() {
    const uptimeElement = byId('uptime');
    if (!uptimeElement) {
        return;
    }

    const startTime = new Date();
    const updateUptime = () => {
        const now = new Date();
        const diff = Math.floor((now - startTime) / 1000);
        const h = Math.floor(diff / 3600).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
        const s = (diff % 60).toString().padStart(2, '0');
        uptimeElement.textContent = `${h}:${m}:${s}`;
    };

    updateUptime();
    setInterval(updateUptime, 1000);
}

function setupMobileNav() {
    const nav = byId('header-nav');
    const toggle = document.querySelector('.nav-toggle');
    if (!nav || !toggle) {
        return;
    }

    const closeNav = () => {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    const openNav = () => {
        nav.classList.add('is-open');
        toggle.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', (event) => {
        event.stopPropagation();
        if (nav.classList.contains('is-open')) {
            closeNav();
        } else {
            openNav();
        }
    });

    nav.addEventListener('click', (event) => {
        const target = event.target;
        if (
            target instanceof HTMLElement &&
            (target.classList.contains('nav-item') || target.classList.contains('nav-sub-item'))
        ) {
            closeNav();
        }
    });

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof Node)) {
            return;
        }
        if (!nav.contains(target) && !toggle.contains(target)) {
            closeNav();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeNav();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeNav();
        }
    });
}

function setSystemInfo() {
    if (templateConfig.system?.documentTitle) {
        document.title = templateConfig.system.documentTitle;
    }
    setText('system-name', templateConfig.system?.systemName);
}

function renderHero() {
    const hero = templateConfig.hero ?? {};
    const section = byId('system-architecture');
    const metrics = byId('hero-metrics');
    const mermaidContainer = byId('hero-mermaid');

    if (section && hero.sectionId) {
        section.id = hero.sectionId;
    }
    setText('hero-panel-title', hero.panelTitle);
    setText('hero-panel-uid', hero.panelUid);

    if (mermaidContainer && hero.diagramId) {
        mermaidContainer.setAttribute('data-mermaid-id', hero.diagramId);
    }

    if (!metrics) {
        return;
    }
    metrics.replaceChildren();
    renderMetricLines(metrics, hero.metrics, '> Add metrics in templateConfig.hero.metrics');
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

function renderTopPanels() {
    const container = byId('top-panels');
    if (!container) {
        return;
    }
    container.replaceChildren();

    const panels = Array.isArray(templateConfig.topPanels) ? templateConfig.topPanels : [];
    panels.forEach((panel, index) => {
        container.appendChild(createTopPanel(panel, index));
    });
}

function renderSkills() {
    const skillsConfig = templateConfig.skills ?? {};
    const section = byId('skill-set');
    const grid = byId('skill-grid');
    if (!grid) {
        return;
    }

    if (section && skillsConfig.sectionId) {
        section.id = skillsConfig.sectionId;
    }
    setText('skills-panel-title', skillsConfig.panelTitle);
    setText('skills-panel-uid', skillsConfig.panelUid);

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

function createNarrativeBlock(label, content, tone) {
    if (!content) {
        return null;
    }

    const block = document.createElement('section');
    block.className = `card-narrative ${tone ? `is-${tone}` : ''}`.trim();

    const heading = document.createElement('h4');
    heading.className = 'card-narrative-title';
    heading.textContent = label;

    const body = document.createElement('p');
    body.className = 'card-narrative-body';
    body.textContent = content;

    block.append(heading, body);
    return block;
}

function createTagList(tags) {
    const normalizedTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    if (normalizedTags.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-tags';

    normalizedTags.forEach((tag) => {
        const item = document.createElement('span');
        item.className = 'card-tag';
        item.textContent = tag;
        wrapper.appendChild(item);
    });

    return wrapper;
}

function createHighlightList(items) {
    const normalizedItems = Array.isArray(items) ? items.filter(Boolean) : [];
    if (normalizedItems.length === 0) {
        return null;
    }

    const list = document.createElement('ul');
    list.className = 'card-highlights';
    normalizedItems.forEach((item) => {
        const line = document.createElement('li');
        line.textContent = item;
        list.appendChild(line);
    });
    return list;
}

function detectEvidencePhase(item) {
    const searchSpace = `${item?.label || ''} ${item?.src || ''}`.toLowerCase();
    if (searchSpace.includes('before')) {
        return 'before';
    }
    if (searchSpace.includes('after')) {
        return 'after';
    }
    return 'other';
}

function buildEvidencePairKey(item) {
    const explicitKey = String(item?.pairKey || '').trim().toLowerCase();
    if (explicitKey) {
        return explicitKey;
    }

    const normalizedLabel = String(item?.label || '')
        .toLowerCase()
        .replace(/\bbefore\b|\bafter\b/g, ' ')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (normalizedLabel) {
        return normalizedLabel;
    }

    return String(item?.src || '')
        .toLowerCase()
        .replace(/\bbefore\b|\bafter\b/g, ' ')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildEvidencePairs(items) {
    const grouped = new Map();

    items.forEach((item) => {
        const key = buildEvidencePairKey(item);
        if (!grouped.has(key)) {
            grouped.set(key, { before: [], after: [], other: [] });
        }
        const bucket = grouped.get(key);
        if (item.phase === 'before') {
            bucket.before.push(item);
            return;
        }
        if (item.phase === 'after') {
            bucket.after.push(item);
            return;
        }
        bucket.other.push(item);
    });

    const pairs = [];
    grouped.forEach((bucket) => {
        const leftItems = [...bucket.before, ...bucket.other];
        const rightItems = bucket.after;
        const pairCount = Math.max(leftItems.length, rightItems.length);

        for (let index = 0; index < pairCount; index += 1) {
            pairs.push({
                before: leftItems[index] || null,
                after: rightItems[index] || null
            });
        }
    });

    return pairs;
}

function toPairSuffix(index) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let value = index;
    let output = '';
    do {
        output = alphabet[value % 26] + output;
        value = Math.floor(value / 26) - 1;
    } while (value >= 0);
    return output;
}

function normalizeEvidenceItems(items) {
    const normalizedItems = Array.isArray(items)
        ? items.filter((item) => item?.src).map((item) => ({
            src: item.src,
            label: item.label || 'EVIDENCE',
            alt: item.alt || item.label || 'evidence image',
            phase: detectEvidencePhase(item),
            pairKey: item.pairKey || '',
            missingBeforeReason: item.missingBeforeReason || '',
            missingAfterReason: item.missingAfterReason || ''
        }))
        : [];
    return normalizedItems;
}

function createEvidenceGallery(items, caseTitle) {
    const normalizedItems = normalizeEvidenceItems(items);
    if (normalizedItems.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-evidence';

    const title = document.createElement('h4');
    title.className = 'card-evidence-title';
    title.textContent = 'PERFORMANCE_EVIDENCE (k6)';

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
            if (typeof openExtraEvidenceModal === 'function') {
                openExtraEvidenceModal(
                    normalizedItems,
                    `${caseTitle || 'Case'} · PERFORMANCE_EVIDENCE`,
                    { initialSrc: item.src }
                );
            } else {
                window.open(item.src, '_blank', 'noopener,noreferrer');
            }

            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'select_content',
                content_type: 'performance_evidence_modal',
                item_id: caseTitle || 'unknown_case',
                evidence_label: item.label || 'unknown_evidence'
            });
        });
        grid.appendChild(trigger);
    });

    wrapper.append(title, grid);
    return wrapper;
}

let openExtraEvidenceModal = null;

function createExtraEvidenceButton(items, caseTitle) {
    const normalizedItems = normalizeEvidenceItems(items);
    if (normalizedItems.length === 0) {
        return null;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'card-extra-actions';

    const button = document.createElement('button');
    button.className = 'card-extra-btn';
    button.type = 'button';
    button.textContent = `EXTRA_IMAGES (${normalizedItems.length})`;
    button.setAttribute('aria-label', `${caseTitle || 'case'} extra evidence images`);

    button.addEventListener('click', () => {
        if (typeof openExtraEvidenceModal === 'function') {
            openExtraEvidenceModal(normalizedItems, `${caseTitle || 'Extra Images'} · EXTRA_IMAGES`);
        }

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            event: 'select_content',
            content_type: 'extra_evidence_modal',
            item_id: caseTitle || 'unknown_case',
            item_count: normalizedItems.length
        });
    });

    wrapper.appendChild(button);
    return wrapper;
}

function createCardLinks(card) {
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
        const link = document.createElement('a');
        link.className = 'card-link';
        link.href = item.href;
        link.textContent = item.label || 'LINK';
        if (!String(item.href).startsWith('mailto:')) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }

        // GA4 Event Tracking
        link.addEventListener('click', () => {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'select_content',
                content_type: 'case_link',
                item_id: card.title || 'unknown_case',
                link_label: item.label,
                link_url: item.href
            });
        });

        wrapper.appendChild(link);
    });

    return wrapper;
}

function createServiceCard(card, sectionConfig) {
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
    description.textContent = card.overview ?? card.description ?? '';

    const roleLine = createMetaLine('ROLE', card.role);
    const stackLine = createMetaLine('STACK', card.stackSummary);
    const problemBlock = createNarrativeBlock('1) 문제', card.problem, 'problem');
    const causeBlock = createNarrativeBlock('2) 원인', card.cause, 'cause');
    const solutionBlock = createNarrativeBlock('3) 해결', card.solution, 'solution');
    const resultBlock = createNarrativeBlock('4) 결과', card.result, 'result');
    const evidenceGallery = createEvidenceGallery(card.evidenceImages, card.title);
    const extraEvidenceButton = createExtraEvidenceButton(card.extraEvidenceImages, card.title);
    const tags = createTagList(card.skills);
    const highlights = createHighlightList(card.highlights);
    const links = createCardLinks(card);

    content.append(title);
    if (subtitleText) {
        content.append(subtitle);
    }
    content.append(description);
    if (roleLine) {
        content.append(roleLine);
    }
    if (stackLine) {
        content.append(stackLine);
    }
    if (problemBlock) {
        content.append(problemBlock);
    }
    if (causeBlock) {
        content.append(causeBlock);
    }
    if (solutionBlock) {
        content.append(solutionBlock);
    }
    if (resultBlock) {
        content.append(resultBlock);
    }
    if (evidenceGallery) {
        content.append(evidenceGallery);
    }
    if (extraEvidenceButton) {
        content.append(extraEvidenceButton);
    }
    if (tags) {
        content.append(tags);
    }
    if (highlights) {
        content.append(highlights);
    }
    if (links) {
        content.append(links);
    }
    article.append(visual, content);
    return article;
}

function renderServiceSections() {
    const container = byId('service-sections');
    if (!container) {
        return;
    }
    container.replaceChildren();

    const sections = Array.isArray(templateConfig.serviceSections) ? templateConfig.serviceSections : [];
    sections.forEach((sectionConfig) => {
        const sectionWrapper = document.createElement('section');
        sectionWrapper.className = 'service-section';
        sectionWrapper.id = sectionConfig.id ?? '';

        const header = document.createElement('div');
        header.className = 'section-header';
        const heading = document.createElement('h2');
        heading.className = 'section-title';
        heading.textContent = sectionConfig.title ?? 'SERVICES';
        header.appendChild(heading);

        const groupsContainer = document.createElement('div');
        groupsContainer.className = 'service-groups';

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
                groupGrid.appendChild(createServiceCard(card, sectionConfig));
            });

            groupSection.appendChild(groupGrid);
            groupsContainer.appendChild(groupSection);
        });

        sectionWrapper.append(header, groupsContainer);
        container.appendChild(sectionWrapper);
    });
}

function renderContact() {
    const contact = templateConfig.contact ?? {};
    const section = byId('contact');
    const actions = byId('contact-actions');

    if (section && contact.sectionId) {
        section.id = contact.sectionId;
    }
    setText('contact-panel-title', contact.panelTitle);
    setText('contact-panel-uid', contact.panelUid);
    setText('contact-description', contact.description);

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
        if (!String(item.href || '').startsWith('mailto:')) {
            action.target = '_blank';
            action.rel = 'noopener noreferrer';
        }
        actions.appendChild(action);
    });
}

function buildDefaultNavigation() {
    const items = [];

    const hero = templateConfig.hero ?? {};
    const skills = templateConfig.skills ?? {};
    const contact = templateConfig.contact ?? {};

    items.push({
        label: hero.panelTitle || 'SYSTEM_ARCHITECTURE',
        target: normalizeHashTarget(hero.sectionId || 'system-architecture')
    });

    const topPanels = Array.isArray(templateConfig.topPanels) ? templateConfig.topPanels : [];
    topPanels.forEach((panel, index) => {
        items.push({
            label: panel.navLabel || panel.panelTitle || `TOP_PANEL_${index + 1}`,
            target: normalizeHashTarget(panel.sectionId || `top-panel-${index + 1}`)
        });
    });

    items.push({
        label: skills.panelTitle || 'SKILL_SET',
        target: normalizeHashTarget(skills.sectionId || 'skill-set')
    });

    const serviceSections = Array.isArray(templateConfig.serviceSections) ? templateConfig.serviceSections : [];
    serviceSections.forEach((section) => {
        items.push({
            label: section.navLabel || section.title || section.id || 'SERVICES',
            target: normalizeHashTarget(section.id || '')
        });
    });

    items.push({
        label: contact.panelTitle || 'CONTACT',
        target: normalizeHashTarget(contact.sectionId || 'contact')
    });

    return items;
}

function buildCaseNavigationItems(casesTarget) {
    const normalizedCasesTarget = normalizeHashTarget(casesTarget || 'cases');
    const sections = Array.isArray(templateConfig.serviceSections) ? templateConfig.serviceSections : [];
    const casesSection = sections.find((section) => normalizeHashTarget(section.id || '') === normalizedCasesTarget);
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
                target: normalizeHashTarget(anchorId)
            });
            sequence += 1;
        });
    });

    return caseItems;
}

function renderNavigation() {
    const nav = byId('header-nav');
    if (!nav) {
        return;
    }
    nav.replaceChildren();

    const configuredNav = Array.isArray(templateConfig.navigation) && templateConfig.navigation.length > 0
        ? templateConfig.navigation
        : buildDefaultNavigation();

    configuredNav.forEach((item) => {
        const normalizedTarget = normalizeHashTarget(item.target);
        const label = String(item.label || '');
        const isCasesMenu = Boolean(item.caseMenu) || label.toUpperCase().includes('CASE');
        const caseItems = isCasesMenu ? buildCaseNavigationItems(normalizedTarget) : [];
        if (caseItems.length > 0) {
            const wrap = document.createElement('div');
            wrap.className = 'nav-item-wrap has-submenu';

            const parent = document.createElement('a');
            parent.className = 'nav-item nav-parent';
            parent.href = normalizedTarget;
            parent.textContent = item.label || 'CASES';
            wrap.appendChild(parent);

            const submenu = document.createElement('div');
            submenu.className = 'nav-submenu';
            caseItems.forEach((caseItem) => {
                const subLink = document.createElement('a');
                subLink.className = 'nav-sub-item';
                subLink.href = normalizeHashTarget(caseItem.target);
                subLink.textContent = caseItem.label || 'CASE';
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
        nav.appendChild(link);
    });
}

function setupScrollSpy() {
    const nav = byId('header-nav');
    if (!nav) {
        return;
    }

    const links = Array.from(nav.querySelectorAll('.nav-item, .nav-sub-item'));
    if (links.length === 0) {
        return;
    }

    const targetMap = new Map();
    links.forEach((link) => {
        const href = String(link.getAttribute('href') || '');
        if (!href.startsWith('#') || href.length < 2) {
            return;
        }

        const targetId = href.slice(1);
        const targetElement = byId(targetId);
        if (!targetElement) {
            return;
        }

        if (!targetMap.has(targetId)) {
            targetMap.set(targetId, {
                element: targetElement,
                links: []
            });
        }
        targetMap.get(targetId).links.push(link);
    });

    if (targetMap.size === 0) {
        return;
    }

    const caseWrap = nav.querySelector('.nav-item-wrap.has-submenu');
    const caseParent = caseWrap?.querySelector('.nav-parent') ?? null;
    let sortedTargets = [];
    let currentActiveId = '';
    let rafToken = 0;

    const clearActive = () => {
        links.forEach((link) => link.classList.remove('is-active'));
        if (caseWrap) {
            caseWrap.classList.remove('is-active-group');
        }
    };

    const activateTarget = (targetId) => {
        if (!targetId || currentActiveId === targetId) {
            return;
        }
        currentActiveId = targetId;
        clearActive();

        const matched = targetMap.get(targetId);
        if (!matched) {
            return;
        }

        matched.links.forEach((link) => link.classList.add('is-active'));
        const hasSubItem = matched.links.some((link) => link.classList.contains('nav-sub-item'));
        if (hasSubItem && caseWrap && caseParent) {
            caseWrap.classList.add('is-active-group');
            caseParent.classList.add('is-active');
        }
    };

    const rebuildTargetOrder = () => {
        sortedTargets = Array.from(targetMap.entries())
            .map(([targetId, payload]) => ({
                targetId,
                top: payload.element.getBoundingClientRect().top + window.scrollY
            }))
            .sort((left, right) => left.top - right.top);
    };

    const applyByScrollPosition = () => {
        if (sortedTargets.length === 0) {
            return;
        }

        const headerHeight = document.querySelector('.status-bar')?.offsetHeight ?? 0;
        const baseline = window.scrollY + headerHeight + 28;
        let activeId = sortedTargets[0].targetId;

        for (let index = 0; index < sortedTargets.length; index += 1) {
            if (baseline >= sortedTargets[index].top) {
                activeId = sortedTargets[index].targetId;
            } else {
                break;
            }
        }

        activateTarget(activeId);
    };

    const scheduleUpdate = () => {
        if (rafToken !== 0) {
            return;
        }
        rafToken = window.requestAnimationFrame(() => {
            rafToken = 0;
            applyByScrollPosition();
        });
    };

    rebuildTargetOrder();
    applyByScrollPosition();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', () => {
        rebuildTargetOrder();
        scheduleUpdate();
    });
    window.addEventListener('hashchange', scheduleUpdate);

    // Mermaid 렌더 완료 후 레이아웃 높이가 변할 수 있어 보정합니다.
    window.setTimeout(() => {
        rebuildTargetOrder();
        scheduleUpdate();
    }, 160);
    window.setTimeout(() => {
        rebuildTargetOrder();
        scheduleUpdate();
    }, 720);
}

function setupExtraEvidenceModal() {
    const modal = byId('extra-evidence-modal');
    const modalContent = byId('extra-evidence-content');
    const modalTitle = byId('extra-evidence-title');

    if (!modal || !modalContent || !modalTitle) {
        return;
    }

    const closeModal = () => {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        modalContent.replaceChildren();
        syncModalBodyLock();
    };

    const openModal = (items, title, options = {}) => {
        const normalizedItems = normalizeEvidenceItems(items);
        if (normalizedItems.length === 0) {
            return;
        }

        const heading = String(title || '').trim();
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

        const evidencePairs = buildEvidencePairs(sortedItems);

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

        const zoomButton = document.createElement('button');
        zoomButton.className = 'extra-evidence-zoom-btn';
        zoomButton.type = 'button';
        zoomButton.textContent = 'ZOOM';

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
        let isZoomed = false;
        const thumbButtons = [];

        const setZoom = (nextZoom) => {
            isZoomed = nextZoom;
            previewImage.classList.toggle('is-zoomed', isZoomed);
            zoomButton.textContent = isZoomed ? 'RESET_ZOOM' : 'ZOOM';
        };

        const setActive = (index) => {
            activeIndex = index;
            const activeItem = sortedItems[index];
            if (!activeItem) {
                return;
            }
            previewImage.src = activeItem.src;
            previewImage.alt = activeItem.alt;
            previewCaption.textContent = `[${activeItem.phase.toUpperCase()}] ${activeItem.label}`;
            originalLink.href = activeItem.src;
            setZoom(false);

            thumbButtons.forEach((button) => {
                const buttonIndex = Number(button.dataset.index || '-1');
                button.classList.toggle('is-active', buttonIndex === index);
            });
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
            button.addEventListener('click', () => setActive(item.__index));
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
            const suffix = toPairSuffix(pairIndex);
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
                const reason = pair.after?.missingBeforeReason || 'N/A 또는 비교축 미수집으로 before 증거가 없습니다.';
                beforeLane.appendChild(createMissingSlot('before', reason, `BEFORE-${suffix}`));
            }

            if (pair.after) {
                afterLane.appendChild(createEvidenceButton(pair.after, `AFTER-${suffix}`));
            } else {
                const reason = pair.before?.missingAfterReason || '해당 비교축의 after 증거가 아직 없거나 범위에서 제외되었습니다.';
                afterLane.appendChild(createMissingSlot('after', reason, `AFTER-${suffix}`));
            }

            body.append(beforeLane, afterLane);
            card.appendChild(body);
            pairList.appendChild(card);
        });

        zoomButton.addEventListener('click', () => setZoom(!isZoomed));
        previewImageWrap.addEventListener('click', () => setZoom(!isZoomed));

        previewImageWrap.appendChild(previewImage);
        previewActions.append(zoomButton, originalLink);
        preview.append(previewImageWrap, previewCaption, previewActions);

        listPanel.appendChild(pairList);
        layout.append(listPanel, preview);
        modalContent.replaceChildren(layout);
        setActive(activeIndex);
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        syncModalBodyLock();
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

    openExtraEvidenceModal = openModal;
}

function injectMermaidSources() {
    const nodes = Array.from(document.querySelectorAll('.mermaid'));
    const diagrams = templateConfig.diagrams ?? {};

    nodes.forEach((container) => {
        const mermaidId = container.getAttribute('data-mermaid-id') || '';
        if (mermaidId && diagrams[mermaidId]) {
            container.innerHTML = diagrams[mermaidId];
            return;
        }

        const label = toSafeLabel(mermaidId || 'undefined_id');
        container.innerHTML = `
            graph TD
            A[${label}] --> B[Define templateConfig.diagrams entry]
        `;
    });

    return nodes;
}

function setupMermaidModal() {
    const modal = byId('mermaid-modal');
    const modalContent = byId('mermaid-modal-content');
    const modalTitle = byId('mermaid-modal-title');
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
        zoomValue.textContent = `${Math.round(zoom * 100)}%`;
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
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        modalContent.replaceChildren();
        endPan();
        modalContent.classList.remove('can-pan');
        activeSvg = null;
        activeCanvas = null;
        baseSvgWidth = 0;
        baseSvgHeight = 0;
        zoom = 1;
        zoomValue.textContent = '100%';
        syncModalBodyLock();
    };

    const openModal = (target) => {
        const sourceSvg = target.querySelector('.mermaid svg');
        if (!sourceSvg) {
            return;
        }

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
        modalTitle.textContent = titleText;

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        syncModalBodyLock();
        scheduleCenterModalView();
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
                return;
            }
            if (action === 'out') {
                setZoom(zoom - ZOOM_STEP);
                return;
            }
            zoom = 1;
            applyZoom();
            scheduleCenterModalView();
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

document.addEventListener('DOMContentLoaded', async () => {
    setSystemInfo();
    setupExtraEvidenceModal();
    renderHero();
    renderTopPanels();
    renderSkills();
    renderServiceSections();
    renderContact();
    renderNavigation();
    setupUptime();
    setupMobileNav();

    const mermaidNodes = injectMermaidSources();
    for (let index = 0; index < mermaidNodes.length; index += 1) {
        const node = mermaidNodes[index];
        const tempClass = `mermaid-render-target-${index}`;
        node.classList.add(tempClass);
        try {
            await mermaid.run({ querySelector: `.${tempClass}` });
        } catch (error) {
            console.error('Mermaid render failed for node:', node, error);
            const failedId = node.getAttribute('data-mermaid-id') || 'unknown';
            node.innerHTML = `<p style="margin:0;color:#ffb4b4;">Diagram render failed: ${failedId}</p>`;
        } finally {
            node.classList.remove(tempClass);
        }
    }

    setupMermaidModal();
    setupScrollSpy();
});
