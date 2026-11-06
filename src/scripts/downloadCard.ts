// ─────────────────────────────────────────────────────────────────────────────
// High-resolution invitation-card renderer.
//
// Draws the invitation onto an off-screen <canvas> at print-grade resolution
// and triggers a PNG download. The look mirrors the live preview rendered by
// InvitationCard.astro: a warm cream panel inside a thin charcoal frame, with
// Great Vibes for the couple's names, Playfair Display for the venue,
// Cormorant Garamond (italic) for the blessing/date/closing message, and Inter
// for the small captions. Keeping the two designs in lockstep means the
// download never surprises the guest — what they saw is what they get.
// ─────────────────────────────────────────────────────────────────────────────

export interface CardData {
  eyebrow: string;
  groom: string;
  bride: string;
  groomParents: string;
  brideParents: string;
  weekday: string;
  monthLong: string;
  day: number;
  year: number;
  time: string;
  venueName: string;
  venueAddress: string;
  message: string;
  blessing: string;
  fileName: string;
}

// Mirrors the CSS custom properties the preview reads from (see
// src/styles/global.css). The on-screen "gold" accent is actually a rich
// charcoal in this theme, and the card background is a very warm off-white.
const COLORS = {
  panel: '#FEFCF7',       // ic-preview-frame background
  outerCream: '#FFFFFF',  // --cream (outer card)
  charcoal: '#3B3B3B',    // --gold (headings, names, when)
  ink: '#141414',         // --ink (venue name)
  inkMute: '#434343',     // --ink-mute (parents, addr, time, msg)
  border: 'rgba(60, 60, 60, 0.4)',  // frame border
  hair: 'rgba(60, 60, 60, 0.5)',    // divider hairlines
};

// 3:4 portrait matches the preview's aspect-ratio exactly; higher resolution
// here means the saved PNG is sharp on any share target.
const W = 1500;
const H = 2000;

const FONT_DISPLAY = '"Playfair Display", "Cormorant Garamond", serif';
const FONT_SERIF = '"Cormorant Garamond", "Times New Roman", serif';
const FONT_SCRIPT = '"Great Vibes", "Pinyon Script", cursive';
const FONT_BODY = '"Inter", -apple-system, "Segoe UI", sans-serif';

async function ensureFonts(): Promise<void> {
  if (!('fonts' in document)) return;
  const needed = [
    `italic 500 44px ${FONT_SERIF}`,
    `600 28px ${FONT_BODY}`,
    `400 150px ${FONT_SCRIPT}`,
    `400 100px ${FONT_SCRIPT}`,
    `400 30px ${FONT_BODY}`,
    `700 64px ${FONT_SERIF}`,
    `700 56px ${FONT_DISPLAY}`,
    `italic 500 36px ${FONT_SERIF}`,
  ];
  try {
    await Promise.all(needed.map((f) => (document as any).fonts.load(f)));
    await (document as any).fonts.ready;
  } catch {
    /* fonts best-effort; canvas falls back to generic families */
  }
}

/** Draw text centred on W/2, wrapping to maxWidth. Returns the y after the block. */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  y: number,
  font: string,
  color: string,
  lineHeight: number,
  maxWidth: number,
  letterSpacing = 0,
): number {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  (ctx as any).letterSpacing = `${letterSpacing}px`;

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += lineHeight;
  }
  (ctx as any).letterSpacing = '0px';
  return y;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function render(ctx: CanvasRenderingContext2D, d: CardData) {
  // Outer frame (mirrors the .ic-preview wrapper).
  ctx.fillStyle = COLORS.outerCream;
  ctx.fillRect(0, 0, W, H);

  // Inner cream panel — the preview's .ic-preview-frame. 6px padding in the
  // preview corresponds to a comfortable gap once scaled up to PNG size.
  const pad = 40;
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 48);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();

  // Thin charcoal border around the whole card, matching
  // `border: 2px solid rgba(60,60,60,0.4)` from the preview.
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 6;
  roundRect(ctx, 16, 16, W - 32, H - 32, 64);
  ctx.stroke();

  const maxW = W - 220;

  // Vertically centre the composition. We know each block's height ahead
  // of time, so sum them up and start from the middle. This matches the
  // preview's `justify-content: center` layout.
  const blocks: Array<() => number> = [];
  let totalH = 0;

  const addBlock = (h: number, draw: (y: number) => void) => {
    const start = totalH;
    blocks.push(() => start + h);
    (blocks[blocks.length - 1] as any).draw = draw;
    (blocks[blocks.length - 1] as any).h = h;
    totalH += h;
    return start;
  };

  if (d.blessing) addBlock(70, (y) => drawWrapped(ctx, d.blessing, y + 48, `italic 500 44px ${FONT_SERIF}`, COLORS.charcoal, 52, maxW));
  addBlock(100, (y) => drawWrapped(ctx, d.eyebrow.toUpperCase(), y + 32, `600 28px ${FONT_BODY}`, COLORS.inkMute, 40, maxW - 40, 3));
  // Great Vibes at 150px has long descenders — the block is sized so the
  // tail of letters like "g"/"y" clears the parents line below rather than
  // kissing it.
  addBlock(230, (y) => drawWrapped(ctx, d.groom, y + 150, `400 150px ${FONT_SCRIPT}`, COLORS.charcoal, 150, maxW));
  addBlock(90, (y) => drawWrapped(ctx, d.groomParents, y + 40, `400 30px ${FONT_BODY}`, COLORS.inkMute, 40, maxW));
  addBlock(140, (y) => drawWrapped(ctx, '&', y + 100, `400 110px ${FONT_SCRIPT}`, COLORS.charcoal, 110, maxW));
  addBlock(230, (y) => drawWrapped(ctx, d.bride, y + 150, `400 150px ${FONT_SCRIPT}`, COLORS.charcoal, 150, maxW));
  addBlock(90, (y) => drawWrapped(ctx, d.brideParents, y + 40, `400 30px ${FONT_BODY}`, COLORS.inkMute, 40, maxW));
  // Divider: hr ✦ hr
  addBlock(80, (y) => {
    const cy = y + 40;
    ctx.strokeStyle = COLORS.hair;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 180, cy); ctx.lineTo(W / 2 - 34, cy);
    ctx.moveTo(W / 2 + 34, cy);  ctx.lineTo(W / 2 + 180, cy);
    ctx.stroke();
    ctx.fillStyle = COLORS.charcoal;
    ctx.font = `400 32px ${FONT_SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦', W / 2, cy);
  });
  addBlock(90, (y) => drawWrapped(ctx, `${d.weekday}, ${d.monthLong} ${d.day}, ${d.year}`, y + 60, `700 56px ${FONT_SERIF}`, COLORS.charcoal, 66, maxW));
  addBlock(50, (y) => drawWrapped(ctx, d.time, y + 34, `400 32px ${FONT_BODY}`, COLORS.inkMute, 40, maxW));
  addBlock(90, (y) => drawWrapped(ctx, d.venueName, y + 60, `700 50px ${FONT_DISPLAY}`, COLORS.ink, 58, maxW));
  addBlock(70, (y) => drawWrapped(ctx, d.venueAddress, y + 32, `400 30px ${FONT_BODY}`, COLORS.inkMute, 38, maxW - 40));
  addBlock(100, (y) => drawWrapped(ctx, d.message, y + 44, `italic 500 36px ${FONT_SERIF}`, COLORS.inkMute, 46, maxW - 40));

  const startY = (H - totalH) / 2;
  let cursor = startY;
  for (const b of blocks) {
    (b as any).draw(cursor);
    cursor += (b as any).h;
  }
}

function triggerDownload(canvas: HTMLCanvasElement, fileName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const finish = (href: string, revoke?: () => void) => {
      const a = document.createElement('a');
      a.href = href;
      a.download = `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (revoke) window.setTimeout(revoke, 4000);
      resolve();
    };

    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (!blob) {
          // Fallback to data URL if blob creation is unsupported.
          try {
            finish(canvas.toDataURL('image/png'));
          } catch (e) {
            reject(e);
          }
          return;
        }
        const url = URL.createObjectURL(blob);
        finish(url, () => URL.revokeObjectURL(url));
      }, 'image/png');
    } else {
      try {
        finish(canvas.toDataURL('image/png'));
      } catch (e) {
        reject(e);
      }
    }
  });
}

export async function downloadInvitationCard(data: CardData): Promise<void> {
  await ensureFonts();

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  render(ctx, data);
  await triggerDownload(canvas, data.fileName || 'wedding-invitation');
}
