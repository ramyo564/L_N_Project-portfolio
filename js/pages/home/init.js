export function initHomePage({
    setSystemInfo,
    setupAnalyticsLifecycle,
    setupK6OverviewModal,
    setupExtraEvidenceModal,
    renderHero,
    renderTopPanels,
    renderSkills,
    renderServiceSections,
    renderContact,
    renderNavigation,
    setupUptime,
    setupMobileNav,
    injectMermaidSources,
    runMermaidWithTempClass,
    mermaid,
    setupMermaidModal,
    setupScrollSpy,
    revealHashTarget
} = {}) {
    document.addEventListener('DOMContentLoaded', async () => {
        setSystemInfo?.();
        setupAnalyticsLifecycle?.();
        setupK6OverviewModal?.();
        setupExtraEvidenceModal?.();
        renderHero?.();
        renderTopPanels?.();
        renderSkills?.();
        renderServiceSections?.();
        renderContact?.();
        renderNavigation?.();
        setupUptime?.();
        setupMobileNav?.();

        const mermaidNodes = injectMermaidSources?.() || [];
        for (let index = 0; index < mermaidNodes.length; index += 1) {
            const node = mermaidNodes[index];
            try {
                await runMermaidWithTempClass?.(mermaid, node, { classPrefix: `mermaid-render-target-${index}` });
            } catch (error) {
                console.error('Mermaid render failed for node:', node, error);
                const failedId = node.getAttribute('data-mermaid-id') || 'unknown';
                node.innerHTML = `<p style="margin:0;color:#ffb4b4;">Diagram render failed: ${failedId}</p>`;
            }
        }

        setupMermaidModal?.();
        setupScrollSpy?.();

        if (window.location.hash) {
            revealHashTarget?.(window.location.hash, 'page_load');
        }
        window.addEventListener('hashchange', () => {
            revealHashTarget?.(window.location.hash, 'hash_change');
        });
    });
}
