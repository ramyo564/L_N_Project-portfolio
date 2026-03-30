export function detectLinkType(href) {
    const target = String(href || '').trim().toLowerCase();
    if (!target) {
        return 'unknown';
    }
    if (target.startsWith('mailto:')) {
        return 'mailto';
    }
    if (target.startsWith('#')) {
        return 'anchor';
    }
    if (target.startsWith('http://') || target.startsWith('https://')) {
        return 'external';
    }
    return 'internal';
}

export function inferDestinationPageType(destinationUrl, options = {}) {
    const raw = String(destinationUrl || '').trim();
    if (!raw) {
        return '';
    }

    const currentPageType = String(options.currentPageType || '');
    const currentUrl = String(options.currentUrl || window.location.href);
    const linkType = detectLinkType(raw);

    if (linkType === 'anchor') {
        return currentPageType;
    }
    if (linkType === 'mailto') {
        return 'contact';
    }
    if (linkType === 'external') {
        return 'external';
    }

    let parsedUrl;
    try {
        parsedUrl = new URL(raw, currentUrl);
    } catch {
        return currentPageType;
    }

    const normalizedPath = String(parsedUrl.pathname || '').toLowerCase();
    if (!normalizedPath || normalizedPath === '/') {
        return currentPageType;
    }
    if (
        normalizedPath === '/portfolio/' ||
        normalizedPath === '/portfolio/index.html' ||
        normalizedPath === '/portfolio'
    ) {
        return 'portfolio_hub';
    }
    if (normalizedPath.includes('-portfolio') || normalizedPath.includes('/docs/')) {
        return 'portfolio';
    }
    return currentPageType;
}
