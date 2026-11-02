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
  siteTitle: 'Pooja & Govind — Wedding Reception Invitation',

  couple: {
    groom: {
      firstName: 'Govind',
      fullName: 'Govind Bhat',
      parents: 'Son of Mr. Sreenivas Bhat & Mrs. Veena Bhat',
      family: 'Memana House, Kochi',
    },
    bride: {
      firstName: 'Pooja',
      fullName: 'Pooja Jose',
      parents: 'Daughter of Mr. P. U. Jose & Mrs. Beena Jose',
      family: 'Parekkudiyil House, Sultan Bathery',
    },
  },

  tagline: 'Together with their families',

  dateISO: '2026-12-09T18:00:00+05:30',
  endISO: '2026-12-09T22:00:00+05:30',
  timeLabel: '6:00 PM onwards',

  venue: {
    name: 'Hotel Grand Iris',
    address: 'NH-766, Sultan Bathery, Wayanad, Kerala',
    photo: '',
    note: 'We would be delighted to have you join us for the celebration.',
  },

  extraDetails: [
    { label: 'Occasion', value: 'Wedding Reception' },
    { label: 'RSVP', value: '+91 90484 11097' },
  ],

  welcomeMessage:
    'With hearts full of joy and gratitude, we warmly welcome you to celebrate the beginning of our beautiful journey together. Your presence and blessings will make our special day even more meaningful.',

  invitationMessage:
    'We request the pleasure of your presence at our wedding reception, as we celebrate this joyous union together with our families and friends.',

  cardBlessing: '',

  music: {
    src: '/music/audio_bg.mp3',
    volume: 0.35,
  },
};
