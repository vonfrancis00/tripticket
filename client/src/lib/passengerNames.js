export const formatPassengerNames = value => String(value ?? '').split(/\r?\n/).map(name => name.trim()).filter(Boolean).join(', ');
