// ─────────────────────────────────────────────────────────────────────────────
// Add-to-Calendar — Google Calendar URL + RFC 5545 .ics generator
//
// Entirely client-side, dependency-free. Both button handlers read the event
// payload from a `data-calendar-event` JSON block rendered by AddToCalendar.astro,
// so the event stays defined in a single place (src/data/wedding.ts).
// ─────────────────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  title: string;         // SUMMARY
  startISO: string;      // start — ISO with explicit offset
  endISO: string;        // end   — ISO with explicit offset
  location: string;      // LOCATION — venue name + address
  description: string;   // DESCRIPTION — free text
  uid: string;           // Stable per-event id, e.g. "govind-pooja-2026@wedding"
}

/**
 * Format a Date as the compact UTC form iCalendar and Google Calendar both
 * expect: `YYYYMMDDTHHMMSSZ`. Both the browser's Date parser and Node's handle
 * ISO strings with explicit timezone offsets correctly, converting to UTC.
 */
function toCalendarUtc(iso: string): string {
  const utc = new Date(iso).toISOString();
  // "2026-12-09T12:30:00.000Z" → "20261209T123000Z"
  return utc.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Escape text for use inside an iCalendar TEXT value per RFC 5545 §3.3.11:
 *   backslash, semicolon, comma and newlines must each be escaped.
 */
function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Build the Google Calendar "render event" URL (the publicly-documented
 * TEMPLATE endpoint, no API or auth required). Opens a prefilled "create
 * event" dialog in whichever account the viewer is signed into.
 */
export function googleCalendarUrl(e: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${toCalendarUtc(e.startISO)}/${toCalendarUtc(e.endISO)}`,
    details: e.description,
    location: e.location,
    sprop: 'website:invitation',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Build a valid .ics (iCalendar) document.
 *
 * Returns a string with CRLF line endings (REQUIRED by RFC 5545 §3.1 —
 * single LF files are rejected by stricter importers like macOS Calendar).
 * Includes a VALARM configured 24 hours before the event start, which most
 * calendar apps interpret as "notify me a day ahead". Guests can still edit
 * the alarm after import, and the import is subject to each app's own rules
 * for how it displays imported alarms.
 */
export function buildIcs(e: CalendarEvent): string {
  const now = toCalendarUtc(new Date().toISOString());
  const summary = escapeIcsText(e.title);
  const description = escapeIcsText(e.description);
  const location = escapeIcsText(e.location);
  const uid = e.uid;

  // Lines joined by CRLF explicitly below.
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Wedding Card//Save the Date//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toCalendarUtc(e.startISO)}`,
    `DTEND:${toCalendarUtc(e.endISO)}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    // 24-hour reminder. ACTION:DISPLAY is the broadest-supported alarm action
    // across Apple Calendar / Outlook / Google import.
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${summary} tomorrow`,
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '', // trailing newline
  ];
  return lines.join('\r\n');
}

/**
 * Trigger a browser download of the .ics content as a file.
 *
 * The `text/calendar` MIME type is what iOS, macOS Calendar and Outlook sniff
 * to offer their "Add to Calendar" dialog on tap. `.ics` extension is also
 * required for Android's Intent handler to recognise it correctly.
 */
export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on the next microtask so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read the event JSON injected by AddToCalendar.astro. */
function readEvent(): CalendarEvent | null {
  const el = document.querySelector('[data-calendar-event]');
  if (!el?.textContent) return null;
  try {
    const parsed = JSON.parse(el.textContent) as Partial<CalendarEvent>;
    if (!parsed.title || !parsed.startISO || !parsed.endISO) return null;
    return {
      title: parsed.title,
      startISO: parsed.startISO,
      endISO: parsed.endISO,
      location: parsed.location ?? '',
      description: parsed.description ?? '',
      uid: parsed.uid ?? `${Date.now()}@wedding-card`,
    };
  } catch {
    return null;
  }
}

export function initAddToCalendar(): void {
  const event = readEvent();
  if (!event) return;

  const googleBtn = document.querySelector<HTMLAnchorElement>('[data-add-google]');
  if (googleBtn) {
    googleBtn.href = googleCalendarUrl(event);
    // target=_blank + rel=noopener handled in markup
  }

  const icsBtn = document.querySelector<HTMLButtonElement>('[data-add-ics]');
  if (icsBtn) {
    icsBtn.addEventListener('click', () => {
      const ics = buildIcs(event);
      // Build a safe filename from the title (strip anything that isn't
      // alphanumeric or hyphen/underscore).
      const safe = event.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'wedding';
      downloadIcs(`${safe}.ics`, ics);
    });
  }
}
