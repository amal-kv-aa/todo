// ─────────────────────────────────────────────────────────────────────────────
// High-resolution invitation-card renderer.
//
// Draws the full invitation onto an off-screen <canvas> at print-grade
// resolution and triggers a PNG download. Rendering directly to canvas (rather
// than screenshotting the DOM) means zero dependencies, crisp output, and the
// result is independent of the surrounding website UI — exactly the shareable
// card described in the brief.
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

const COLORS = {
  cream: '#ede1d3',
  creamTop: '#f6ecdd',
  gold: '#b0894a',
  goldSoft: '#c89b50',
  goldDeep: '#8a6a2f',
  mutedGold: '#8a6a2f',
  ink: '#7c5c30',
  inkSoft: '#6b5433',
};

// 5:7 portrait, high resolution for sharp sharing.
const W = 1250;
const H = 1750;

const FONT_DISPLAY = '"Cormorant Garamond", serif';
const FONT_SCRIPT = '"Great Vibes", cursive';
const FONT_BODY = '"Montserrat", sans-serif';

async function ensureFonts(): Promise<void> {
  if (!('fonts' in document)) return;
  const needed = [
    `600 80px ${FONT_DISPLAY}`,
    `italic 500 44px ${FONT_DISPLAY}`,
    `700 60px ${FONT_DISPLAY}`,
    `400 120px ${FONT_SCRIPT}`,
    `600 26px ${FONT_BODY}`,
    `400 26px ${FONT_BODY}`,
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

/** A small elegant corner sprig drawn at the given corner via transforms. */
function drawCorner(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, sy);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // Two sweeping lines following the corner.
  ctx.beginPath();
  ctx.moveTo(0, 110);
  ctx.bezierCurveTo(0, 48, 48, 0, 110, 0);
  ctx.stroke();

  ctx.globalAlpha = 0.65;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(14, 110);
  ctx.bezierCurveTo(14, 58, 58, 14, 110, 14);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Little leaf pair + dot at the elbow.
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(40, 40);
  ctx.quadraticCurveTo(26, 20, 34, 2);
  ctx.quadraticCurveTo(52, 14, 40, 40);
  ctx.moveTo(40, 40);
  ctx.quadraticCurveTo(20, 26, 2, 34);
  ctx.quadraticCurveTo(14, 52, 40, 40);
  ctx.stroke();

  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(40, 40, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  // Background
  const bg = ctx.createRadialGradient(W / 2, 0, 80, W / 2, H * 0.4, H);
  bg.addColorStop(0, COLORS.creamTop);
  bg.addColorStop(1, COLORS.cream);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Frame
  const m = 70;
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  roundRect(ctx, m, m, W - m * 2, H - m * 2, 12);
  ctx.stroke();

  ctx.strokeStyle = COLORS.goldSoft;
  ctx.lineWidth = 1.5;
  roundRect(ctx, m + 14, m + 14, W - (m + 14) * 2, H - (m + 14) * 2, 8);
  ctx.stroke();

  // Corner sprigs
  const ci = m + 30;
  drawCorner(ctx, ci, ci, 1, 1);
  drawCorner(ctx, W - ci, ci, -1, 1);
  drawCorner(ctx, ci, H - ci, 1, -1);
  drawCorner(ctx, W - ci, H - ci, -1, -1);

  const maxW = W - 300;
  let y = 250;

  if (d.blessing) {
    y = drawWrapped(ctx, d.blessing, y, `italic 500 40px ${FONT_DISPLAY}`, COLORS.mutedGold, 48, maxW);
    y += 24;
  } else {
    y += 20;
  }

  // Small sprig ornament
  ctx.save();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  const sx = W / 2;
  ctx.beginPath();
  ctx.moveTo(sx, y - 6);
  ctx.lineTo(sx, y + 34);
  for (let i = 0; i < 3; i++) {
    const yy = y + 2 + i * 12;
    ctx.moveTo(sx, yy);
    ctx.quadraticCurveTo(sx - 18, yy - 2, sx - 26, yy - 12);
    ctx.moveTo(sx, yy);
    ctx.quadraticCurveTo(sx + 18, yy - 2, sx + 26, yy - 12);
  }
  ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(sx, y - 8, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  y += 74;

  y = drawWrapped(ctx, d.eyebrow.toUpperCase(), y, `600 26px ${FONT_BODY}`, COLORS.inkSoft, 36, maxW - 60, 3);
  y += 40;

  y = drawWrapped(ctx, d.groom, y, `600 76px ${FONT_DISPLAY}`, COLORS.ink, 82, maxW);
  y += 6;
  y = drawWrapped(ctx, d.groomParents, y, `400 26px ${FONT_BODY}`, COLORS.inkSoft, 34, maxW);
  y += 18;

  drawWrapped(ctx, '&', y + 40, `400 110px ${FONT_SCRIPT}`, COLORS.goldDeep, 110, maxW);
  y += 96;

  y = drawWrapped(ctx, d.bride, y, `600 76px ${FONT_DISPLAY}`, COLORS.ink, 82, maxW);
  y += 6;
  y = drawWrapped(ctx, d.brideParents, y, `400 26px ${FONT_BODY}`, COLORS.inkSoft, 34, maxW);
  y += 40;

  // Divider
  ctx.strokeStyle = COLORS.goldSoft;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 150, y);
  ctx.lineTo(W / 2 - 24, y);
  ctx.moveTo(W / 2 + 24, y);
  ctx.lineTo(W / 2 + 150, y);
  ctx.stroke();
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(W / 2, y, 4, 0, Math.PI * 2);
  ctx.fill();
  y += 54;

  y = drawWrapped(ctx, d.weekday.toUpperCase(), y, `600 26px ${FONT_BODY}`, COLORS.mutedGold, 34, maxW, 5);
  y += 12;
  y = drawWrapped(ctx, `${d.monthLong} ${d.day}, ${d.year}`, y, `700 56px ${FONT_DISPLAY}`, COLORS.goldDeep, 60, maxW);
  y += 6;
  y = drawWrapped(ctx, d.time, y, `400 30px ${FONT_BODY}`, COLORS.inkSoft, 38, maxW);
  y += 44;

  y = drawWrapped(ctx, d.venueName, y, `600 40px ${FONT_DISPLAY}`, COLORS.ink, 46, maxW);
  y += 4;
  y = drawWrapped(ctx, d.venueAddress, y, `400 26px ${FONT_BODY}`, COLORS.inkSoft, 34, maxW - 40);
  y += 40;

  drawWrapped(ctx, d.message, y, `italic 500 34px ${FONT_DISPLAY}`, COLORS.inkSoft, 44, maxW - 20);
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
