const baseMermaidConfig = {
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
        darkMode: true,
        background: '#050505',
        mainBkg: '#111111',
        primaryColor: '#141414',
        primaryTextColor: '#FFFFFF',
        primaryBorderColor: 'rgba(255, 255, 255, 0.35)',
        lineColor: 'rgba(255, 255, 255, 0.45)',
        secondaryColor: '#181818',
        tertiaryColor: '#0A0A0A',
        nodeBorder: 'rgba(255, 255, 255, 0.35)',
        clusterBkg: '#0A0A0A',
        clusterBorder: 'rgba(255, 255, 255, 0.2)',
        titleColor: '#FFFFFF',
        edgeLabelBackground: '#000000',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px'
    },
    securityLevel: 'loose',
    fontFamily: 'Inter',
    flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'linear'
    }
};

let mermaidRenderSequence = 0;

function buildMermaidConfig(overrideConfig = {}) {
    return {
        ...baseMermaidConfig,
        ...(overrideConfig ?? {}),
        flowchart: {
            ...baseMermaidConfig.flowchart,
            ...(overrideConfig?.flowchart ?? {})
        }
    };
}

export function initializeMermaid(mermaidLib, overrideConfig = {}) {
    if (!mermaidLib || typeof mermaidLib.initialize !== 'function') {
        return;
    }
    mermaidLib.initialize(buildMermaidConfig(overrideConfig));
}

export async function runMermaidWithTempClass(mermaidLib, container, options = {}) {
    if (!(container instanceof HTMLElement)) {
        return;
    }

    mermaidRenderSequence += 1;
    const classPrefix = options.classPrefix || 'mermaid-render-target';
    const tempClass = `${classPrefix}-${mermaidRenderSequence}`;
    container.classList.add(tempClass);
    try {
        await mermaidLib.run({ querySelector: `.${tempClass}` });
    } finally {
        container.classList.remove(tempClass);
    }
}
