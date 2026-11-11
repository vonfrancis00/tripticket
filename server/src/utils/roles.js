// Keep permission identifiers stable while accepting display names.
export const normalizeRole = role => typeof role === 'string' ? role.trim().toLowerCase().replace(/\s+/g, '_') : role;
