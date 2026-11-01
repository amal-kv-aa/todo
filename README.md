# 💛 Digital Wedding Invitation

A premium, fully responsive digital wedding invitation with a champagne-gold &
white theme — built with [Astro](https://astro.build). It features a welcome
screen with a live countdown, a candle-lighting ceremony that transitions into
the invitation, romantic background music, Google Maps directions, and a
downloadable high-resolution invitation card.

## ✏️ Customising for your wedding

**Everything the couple needs is in one file:** [`src/data/wedding.ts`](src/data/wedding.ts).

Edit the `wedding` object there — names, parents/family, tagline, date & time,
venue (with optional coordinates and photo), welcome & invitation wording, and
music. Every screen, the live countdown, the Google Maps link, and the
downloadable card all read from this single source. Optional fields may be left
as `""` and the UI hides them gracefully.

Key fields:

| Field | Notes |
| :-- | :-- |
| `dateISO` | ISO 8601 **with a timezone offset**, e.g. `2026-12-20T10:30:00+05:30`. The countdown uses the absolute instant, so it stays correct for guests in any timezone. |
| `venue.lat` / `venue.lng` | Optional coordinates — give the most accurate "Get Directions" link. Falls back to the address if omitted. |
| `venue.photo` | Optional image path in `public/` (e.g. `/venue.jpg`). |
| `music.src` | Optional instrumental audio file in `public/` (e.g. `/music.mp3`). Leave `""` to use the built-in gentle generative ambient melody (no file or dependency needed). |

Music never plays before the guest interacts (it starts after the candle tap),
and the preference is remembered. All animations respect `prefers-reduced-motion`.

## 🧩 Project structure

```text
src/
├── data/
│   ├── wedding.ts        ← all couple-specific content (edit this)
│   └── format.ts         ← date formatting + Google Maps URL helper
├── components/
│   ├── WelcomeScreen.astro   welcome, date card, candle CTA
│   ├── Countdown.astro       live two-card countdown
│   ├── CandleCeremony.astro  candle-lighting overlay
│   ├── Invitation.astro      inner screen: welcome, couple, details
│   ├── Venue.astro           venue + Get Directions
│   ├── InvitationCard.astro  on-screen card + download button
│   ├── MusicToggle.astro     top-right music control
│   └── Ornament.astro        reusable gold SVG ornaments
├── scripts/
│   ├── app.ts            reveals, ceremony, screen transition, wiring
│   ├── music.ts          file / generative music controller
│   └── downloadCard.ts   high-res canvas → PNG renderer
├── styles/global.css     theme tokens, buttons, animations
├── layouts/Layout.astro  document shell + fonts
└── pages/index.astro     composition
```

## 🧞 Commands

| Command            | Action                                       |
| :----------------- | :------------------------------------------- |
| `npm install`      | Install dependencies                         |
| `npm run dev`      | Start local dev server at `localhost:4321`   |
| `npm run build`    | Build the production site to `./dist/`       |
| `npm run preview`  | Preview the production build locally         |

See the full [Astro documentation](https://docs.astro.build).
