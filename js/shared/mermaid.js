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
