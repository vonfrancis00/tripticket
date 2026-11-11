export const normalizeRole = role => typeof role === 'string' ? role.trim().toLowerCase().replace(/\s+/g, '_') : role;
export const roleLabel = role => ({ admin: 'Admin', admin_officer: 'Admin Officer', driver: 'Driver' })[normalizeRole(role)] || role;
