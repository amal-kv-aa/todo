// ─────────────────────────────────────────────────────────────────────────────
// Wedding configuration
// ─────────────────────────────────────────────────────────────────────────────
// This is the ONLY file the couple needs to edit. Replace the sample data below
// with the real wedding details. Every screen, the countdown, the maps link and
// the downloadable card all read from here. Optional fields may be left as empty
// strings ("") and the UI will hide them gracefully.
// ─────────────────────────────────────────────────────────────────────────────

export interface WeddingConfig {
  /** Shown in the browser tab and share previews. */
  siteTitle: string;

  couple: {
    groom: {
      firstName: string;
      fullName: string;
      /** e.g. "Son of Mr. … & Mrs. …" */
      parents: string;
      /** Optional one-line family note. Leave "" to hide. */
      family?: string;
    };
    bride: {
      firstName: string;
      fullName: string;
      parents: string;
      family?: string;
    };
  };

  /** Short line under the names, e.g. "Together with their families". */
  tagline: string;

  /**
   * Wedding date & time in ISO 8601 WITH an explicit timezone offset so the
   * live countdown is correct for every guest regardless of their location.
   * Example: "2026-12-20T10:30:00+05:30" (India Standard Time).
   */
  dateISO: string;

  /**
   * Optional end time in the same ISO format. Used only by the Add-to-Calendar
   * feature. If omitted, defaults to 3 hours after `dateISO`.
   */
  endISO?: string;

  /** Human-readable time, shown on the cards (e.g. "10:30 AM"). */
  timeLabel: string;

  venue: {
    name: string;
    address: string;
    /** Optional. Precise coordinates give the most accurate directions. */
    lat?: number;
    lng?: number;
    /** Optional path to a venue photo in /public (e.g. "/venue.jpg"). */
    photo?: string;
    /** Optional short welcome note for the venue section. */
    note?: string;
  };

  /** Optional extra ceremony/reception lines shown in the details card. */
  extraDetails?: { label: string; value: string }[];

  /** Short quote shown in the footer. */
  footerQuote?: string;

  /** Footer closing lines. */
  footerRegards?: string;

  welcomeMessage: string;

  /** Wording printed on the downloadable invitation card. */
  invitationMessage: string;

  /** Optional cultural/religious motif line on the card (e.g. a blessing). */
  cardBlessing?: string;

  music: {
    /**
     * Optional path to an instrumental audio file in /public (e.g. "/music.mp3").
     * Leave "" to use the built-in gentle, generative ambient melody instead —
     * no external file or dependency required.
     */
    src: string;
    volume: number; // 0–1
  };
}

export const wedding: WeddingConfig = {
  siteTitle: 'Govind & Pooja — Wedding Invitation',

  couple: {
    groom: {
      firstName: 'Govind',
      fullName: 'Chi. Govind',
      parents: 'Son of Smt. Veena & Sri. M.R. Sreenivas Bhat',
      family:
        'Grandson of late Smt. Sunandha Bai & late M.V. Ramachandra Bhat, Kochi · Grandson of Smt. Nalini Prabhu & late Sri. C. Rajagopala Prabhu, Kozhikode',
    },
    bride: {
      firstName: 'Pooja',
      fullName: 'Chi. Sau. Pooja',
      parents: 'D/o Smt. Beena Jose & Sri. P.U. Jose',
      family: 'Parekkudiyil House, Moolankave P.O, Sulthan Bathery, Wayanad, Kerala',
    },
  },

  tagline:
    'Smt. Sandhya & Sri. M.R. Premachandra Bhat cordially invite you and your family for the wedding ceremony',

  // Sunday, December 6, 2026 · 11:35 AM to 12:15 PM IST (Kumbha Lagham)
  dateISO: '2026-12-06T11:35:00+05:30',
  endISO: '2026-12-06T12:15:00+05:30',
  timeLabel: '11:35 AM to 12:15 PM',

  venue: {
    name: 'Sri. Sukratheendra Kalamandir',
    address: 'Kozhikode',
    photo: '',
    note: 'We would be delighted to have you join us for the ceremony.',
  },

  extraDetails: [
    { label: 'Muhurtham', value: '11:35 AM to 12:15 PM (Kumbha Lagham)' },
    { label: 'RSVP', value: '+91 90484 11097' },
  ],

  footerQuote:
    'Two lives, two hearts, joined together in friendship, united forever in love.',

  footerRegards:
    'With warm regards, Smt. Sandhya & Sri. M.R. Premachandra Bhat and Family',

  welcomeMessage:
    'Smt. Sandhya & Sri. M.R. Premachandra Bhat cordially invite you and your family for the wedding ceremony of Govind & Pooja. Your presence is our greatest blessing.',

  invitationMessage:
    'Your presence is our greatest blessing. Presents in blessings only.',

  cardBlessing: '|| Shree Kula Devatha Prasanna ||',

  music: {
    src: '/music/audio_wedding.mp3',
    volume: 0.35,
  },
};
