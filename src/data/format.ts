import { wedding } from './wedding';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Pull the wall-clock calendar parts straight from the configured ISO string
 * (e.g. "2026-12-20T10:30:00+05:30") so the displayed date always matches what
 * the couple configured, regardless of the server's or build machine's timezone.
 * The live countdown separately uses the absolute instant, so it stays correct
 * for guests in any timezone.
 */
function parseWallClock(iso: string) {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return { year: 0, month0: 0, day: 1 };
  return { year: +m[1], month0: +m[2] - 1, day: +m[3] };
}

const { year, month0, day } = parseWallClock(wedding.dateISO);
const weekdayIndex = new Date(Date.UTC(year, month0, day)).getUTCDay();

export const weddingDate = {
  /** Full year, e.g. 2026 */
  year,
  /** 1–31 */
  day,
  /** e.g. "December" */
  monthLong: MONTHS[month0] ?? '',
  /** e.g. "Dec" */
  monthShort: (MONTHS[month0] ?? '').slice(0, 3),
  /** e.g. "Sunday" */
  weekday: WEEKDAYS[weekdayIndex] ?? '',
  /** The configured clock time label, e.g. "10:30 AM" */
  time: wedding.timeLabel,
  /** The absolute instant, for the client countdown */
  iso: wedding.dateISO,
};

/** Build a Google Maps directions URL from coordinates (preferred) or address. */
export function mapsDirectionsUrl(): string {
  const { lat, lng, name, address } = wedding.venue;
  const base = 'https://www.google.com/maps/dir/?api=1&destination=';
  if (typeof lat === 'number' && typeof lng === 'number') {
    return `${base}${lat},${lng}`;
  }
  return `${base}${encodeURIComponent(`${name}, ${address}`)}`;
}
