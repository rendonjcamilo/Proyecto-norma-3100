const LOCALE = 'es-CO';
const TZ = 'America/Bogota';

type DateInput = string | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(value?: DateInput): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: TZ,
  });
}

export function formatDateLong(value?: DateInput): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: TZ,
  });
}

export function formatDateTime(value?: DateInput): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleString(LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });
}

export function formatTime(value?: DateInput): string {
  const d = toDate(value);
  if (!d) return '—';
  return d.toLocaleTimeString(LOCALE, { timeZone: TZ });
}

export function formatTimeAgo(value: DateInput): string {
  const d = toDate(value);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days > 1 ? 's' : ''}`;
  return formatDate(d);
}
