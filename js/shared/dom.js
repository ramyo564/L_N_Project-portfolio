export function byId(id) {
    return document.getElementById(id);
}

export function toSafeLabel(value) {
    return String(value ?? 'unknown').replace(/[^a-zA-Z0-9_-]+/g, ' ').trim() || 'unknown';
}
