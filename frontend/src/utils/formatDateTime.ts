export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const datePart = d.toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const timePart = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${datePart}, ${timePart} (${timeZone})`;
}
