import {normalizeRole} from './roles.js';
// The account name must match the complete Driver column, never a partial name.
export const canViewAllTrips = user => ['admin', 'admin_officer'].includes(normalizeRole(user?.role));

export function tripAccessFilter(user) {
  if (canViewAllTrips(user)) return {};
  const name = String(user?.name || '').trim();
  if (!name) return { _id: null };
  const escaped = name.split(/\s+/).map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
  return { driverName: { $regex: `^\\s*${escaped}\\s*$`, $options: 'i' } };
}
