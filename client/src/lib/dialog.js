const queue = [];
const listeners = new Set();
const notify = () => listeners.forEach((listener) => listener());

export const subscribeDialog = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getDialog = () => queue[0] || null;
export function closeDialog(confirmed = false) {
  if (queue[0]?.pending) return;
  const current = queue.shift();
  notify();
  current?.resolve(confirmed);
}
export async function confirmDialog() {
  const current = queue[0];
  if (!current || current.pending) return;
  if (!current.onConfirm) return closeDialog(true);
  queue[0] = { ...current, pending: true, error: '' };
  notify();
  try {
    await current.onConfirm();
    queue.shift();
    notify();
    current.resolve(true);
  } catch (error) {
    queue[0] = { ...current, error: error.message || 'Something went wrong. Please try again.' };
    notify();
  }
}
export function showDialog(options) {
  return new Promise((resolve) => {
    queue.push({ ...options, resolve });
    notify();
  });
}
