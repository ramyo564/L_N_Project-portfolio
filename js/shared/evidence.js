export function detectEvidencePhase(item) {
    const searchSpace = `${item?.label || ''} ${item?.src || ''}`.toLowerCase();
    if (searchSpace.includes('before')) {
        return 'before';
    }
    if (searchSpace.includes('after')) {
        return 'after';
    }
    return 'other';
}

export function normalizeEvidenceLabel(label) {
    return String(label || '')
        .toLowerCase()
        .replace(/\bbefore\b|\bafter\b/g, ' ')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[:：]+/g, ' ')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function buildEvidencePairKey(item, options = {}) {
    const explicitKey = String(item?.pairKey || '').trim().toLowerCase();
    if (explicitKey) {
        return explicitKey;
    }

    const normalizedLabel = normalizeEvidenceLabel(item?.label || '');
    if (normalizedLabel) {
        if (options.collapseK6Numbers && normalizedLabel.includes('k6')) {
            return normalizedLabel
                .replace(/\b\d+\s*vu\b/g, ' ')
                .replace(/\b\d+\b/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }
        return normalizedLabel;
    }

    return String(item?.src || '')
        .toLowerCase()
        .replace(/\bbefore\b|\bafter\b/g, ' ')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeEvidenceItems(items, options = {}) {
    if (!Array.isArray(items)) {
        return [];
    }

    const includeCaption = Boolean(options.includeCaption);
    const altFromCaption = Boolean(options.altFromCaption);

    return items
        .filter((item) => item && item.src)
        .map((item) => {
            const normalized = {
                label: item.label || 'EVIDENCE',
                src: item.src,
                alt: item.alt
                    || (altFromCaption ? (item.caption || item.description || '') : '')
                    || item.label
                    || 'evidence image',
                phase: ['before', 'after', 'other'].includes(String(item.phase || '').toLowerCase())
                    ? String(item.phase).toLowerCase()
                    : detectEvidencePhase(item),
                pairKey: item.pairKey || '',
                missingBeforeReason: item.missingBeforeReason || '',
                missingAfterReason: item.missingAfterReason || ''
            };

            if (includeCaption) {
                normalized.caption = item.caption || item.description || '';
            }

            return normalized;
        });
}

export function buildEvidencePairs(items, options = {}) {
    const includeKey = Boolean(options.includeKey);
    const pairKeyResolver = typeof options.pairKeyResolver === 'function'
        ? options.pairKeyResolver
        : (item) => buildEvidencePairKey(item, options);

    const grouped = new Map();
    items.forEach((item) => {
        const key = pairKeyResolver(item);
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
    grouped.forEach((bucket, key) => {
        const beforeItems = [...bucket.before, ...bucket.other];
        const afterItems = bucket.after;
        const pairCount = Math.max(beforeItems.length, afterItems.length);

        for (let index = 0; index < pairCount; index += 1) {
            const pair = {
                before: beforeItems[index] || null,
                after: afterItems[index] || null
            };
            if (includeKey) {
                pair.key = key;
            }
            pairs.push(pair);
        }
    });

    return pairs;
}
