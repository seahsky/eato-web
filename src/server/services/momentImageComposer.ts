import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";

/**
 * Server-side image composition for Meal Circles:
 *   - composeMomentGrid(momentId)  → per-meal split grid (story 1080×1920)
 *   - composeDayCard(circleId, date?) → daily rollup of all moment grids
 *
 * Uses sharp + SVG composite. We avoid pulling in @napi-rs/canvas so the
 * dependency footprint stays consistent with the existing image pipeline
 * (sharp is already a transitive dep via Next.js).
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const PADDING = 48;
const TITLE_BAR_H = 200;
const SLOT_GAP = 16;

// Lazy R2 client — composer may run with R2 vars missing in dev.
let s3: S3Client | null = null;
function getS3(): S3Client | null {
  if (s3) return s3;
  if (
    !R2_ACCOUNT_ID ||
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !R2_BUCKET_NAME
  ) {
    return null;
  }
  s3 = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  return s3;
}

async function uploadComposite(
  buf: Buffer,
  key: string,
  contentType = "image/jpeg"
): Promise<string | null> {
  const client = getS3();
  if (!client || !R2_BUCKET_NAME || !R2_PUBLIC_URL) return null;
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buf,
      ContentType: contentType,
    })
  );
  return `${R2_PUBLIC_URL.replace(/\/+$/, "")}/${key}`;
}

// Escape user-controlled strings for safe inclusion inside SVG <text>.
function svgEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Choose a grid layout that fits N slots reasonably in a 1×N..3×3 range.
function gridDimensions(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n === 2) return { cols: 1, rows: 2 };
  if (n <= 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 2, rows: 3 };
  return { cols: 3, rows: 3 }; // up to 8 members; one extra slot stays unused
}

/**
 * Fetch a remote image and resize-cover it to (w, h) as a sharp Buffer.
 * On failure (network / decode), returns null and the caller renders a
 * placeholder.
 */
async function fetchSlotImage(
  url: string,
  w: number,
  h: number
): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    const buf = await sharp(Buffer.from(ab))
      .resize(w, h, { fit: "cover", position: "center" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return buf;
  } catch (err) {
    console.error("fetchSlotImage failed:", url, err);
    return null;
  }
}

/**
 * Compose a per-meal split grid for a MealMoment and store it on the row.
 * Idempotent: re-running re-uploads but yields a stable URL key.
 */
export async function composeMomentGrid(
  momentId: string
): Promise<string | null> {
  const moment = await prisma.mealMoment.findUnique({
    where: { id: momentId },
    include: {
      circle: { select: { id: true, name: true, emoji: true, showEmptySlots: true } },
      entries: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!moment) return null;

  // Skip if no member logged anything — nothing visually meaningful.
  const hasContent = moment.entries.some((e) => !!e.foodEntryId);
  if (!hasContent) return null;

  const entries = moment.circle.showEmptySlots
    ? moment.entries
    : moment.entries.filter((e) => !!e.foodEntryId);

  const { cols, rows } = gridDimensions(entries.length);

  const innerY = TITLE_BAR_H;
  const innerH = CANVAS_H - innerY - PADDING;
  const slotW = Math.floor((CANVAS_W - PADDING * 2 - SLOT_GAP * (cols - 1)) / cols);
  const slotH = Math.floor((innerH - SLOT_GAP * (rows - 1)) / rows);

  // Background + title bar.
  const dateStr = moment.firedAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
  const titleSvg = `
    <svg width="${CANVAS_W}" height="${CANVAS_H}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0F1117"/>
      <text x="${PADDING}" y="${PADDING + 64}"
            font-family="-apple-system, system-ui, sans-serif"
            font-size="56" font-weight="700" fill="#FFFFFF">
        ${svgEscape(moment.circle.emoji)} ${svgEscape(moment.circle.name)}
      </text>
      <text x="${PADDING}" y="${PADDING + 124}"
            font-family="-apple-system, system-ui, sans-serif"
            font-size="36" fill="#A0A4B0">
        ${svgEscape(moment.label)} · ${svgEscape(dateStr)}
      </text>
    </svg>`;

  // Start with the title-bar SVG as the canvas background.
  let canvas = sharp(Buffer.from(titleSvg)).jpeg({ quality: 88 });

  const composites: sharp.OverlayOptions[] = [];

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PADDING + col * (slotW + SLOT_GAP);
    const y = innerY + row * (slotH + SLOT_GAP);

    // Slot photo or placeholder.
    if (e.photoUrl) {
      const photo = await fetchSlotImage(e.photoUrl, slotW, slotH);
      if (photo) {
        composites.push({ input: photo, top: y, left: x });
      } else {
        composites.push({
          input: Buffer.from(slotPlaceholderSvg(slotW, slotH, e.user.name, "—")),
          top: y,
          left: x,
        });
      }
    } else {
      composites.push({
        input: Buffer.from(
          slotPlaceholderSvg(slotW, slotH, e.user.name, "didn't log")
        ),
        top: y,
        left: x,
      });
    }

    // Member name strip overlay at the bottom of each slot.
    const nameSvg = `
      <svg width="${slotW}" height="56" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)"/>
        <text x="16" y="36"
              font-family="-apple-system, system-ui, sans-serif"
              font-size="24" font-weight="600" fill="#FFFFFF">
          ${svgEscape(e.user.name ?? "Member")}
        </text>
      </svg>`;
    composites.push({
      input: Buffer.from(nameSvg),
      top: y + slotH - 56,
      left: x,
    });
  }

  canvas = canvas.composite(composites);
  const buf = await canvas.toBuffer();

  const key = `circle-moments/${moment.circle.id}/${moment.id}.jpg`;
  const url = await uploadComposite(buf, key);
  if (!url) return null;

  await prisma.mealMoment.update({
    where: { id: moment.id },
    data: { gridImageUrl: url },
  });
  return url;
}

function slotPlaceholderSvg(
  w: number,
  h: number,
  name: string | null,
  caption: string
): string {
  const displayName = name ?? "Member";
  return `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1A1D26"/>
      <text x="50%" y="48%" text-anchor="middle"
            font-family="-apple-system, system-ui, sans-serif"
            font-size="28" font-weight="600" fill="#FFFFFF">
        ${svgEscape(displayName)}
      </text>
      <text x="50%" y="58%" text-anchor="middle"
            font-family="-apple-system, system-ui, sans-serif"
            font-size="22" fill="#A0A4B0">
        ${svgEscape(caption)}
      </text>
    </svg>`;
}

/**
 * Compose the DayCard for a circle on a given local date.
 *
 * `dateStart` is interpreted as midnight UTC of the date in question (the
 * same encoding used by the nightly Agenda job and by mealMoment.dayCard).
 * If `dateStart` is omitted, it defaults to the start of "yesterday" in
 * UTC — useful for the nightly midnight job that runs at the start of a
 * new local day and rolls up the day that just closed.
 */
export async function composeDayCard(
  circleId: string,
  dateStart?: Date
): Promise<{ id: string; imageUrl: string; date: Date } | null> {
  const circle = await prisma.circle.findUnique({
    where: { id: circleId },
    select: { id: true, name: true, emoji: true, timezone: true },
  });
  if (!circle) return null;

  const date = dateStart ?? startOfYesterdayLocal(circle.timezone);
  const dayStart = date;
  const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  const moments = await prisma.mealMoment.findMany({
    where: {
      circleId: circle.id,
      firedAt: { gte: dayStart, lt: dayEnd },
    },
    select: { id: true, gridImageUrl: true, label: true, firedAt: true, entries: { select: { foodEntryId: true } } },
    orderBy: { firedAt: "asc" },
  });

  // Skip days where nobody logged anything.
  const usable = moments.filter((m) => m.entries.some((e) => e.foodEntryId));
  if (usable.length === 0) return null;

  // Build the day card. Stack the moment grids vertically with a header.
  const header = `
    <svg width="${CANVAS_W}" height="240" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0F1117"/>
      <text x="${PADDING}" y="100"
            font-family="-apple-system, system-ui, sans-serif"
            font-size="64" font-weight="700" fill="#FFFFFF">
        ${svgEscape(circle.emoji)} ${svgEscape(circle.name)}
      </text>
      <text x="${PADDING}" y="170"
            font-family="-apple-system, system-ui, sans-serif"
            font-size="36" fill="#A0A4B0">
        ${svgEscape(date.toISOString().slice(0, 10))}
      </text>
    </svg>`;

  const headerBuf = await sharp(Buffer.from(header)).png().toBuffer();
  const tileH = Math.floor((CANVAS_H - 240 - PADDING) / usable.length);

  const tiles: sharp.OverlayOptions[] = [];
  let cursorY = 240;

  for (const m of usable) {
    if (!m.gridImageUrl) {
      // Compose lazily if missing (close-moment job may not have run yet).
      try {
        await composeMomentGrid(m.id);
      } catch (err) {
        console.error("composeDayCard inline composeMomentGrid failed:", err);
      }
    }
    const refreshed = await prisma.mealMoment.findUnique({
      where: { id: m.id },
      select: { gridImageUrl: true },
    });
    if (!refreshed?.gridImageUrl) continue;
    const tile = await fetchSlotImage(refreshed.gridImageUrl, CANVAS_W, tileH);
    if (!tile) continue;
    tiles.push({ input: tile, top: cursorY, left: 0 });
    cursorY += tileH;
  }

  const canvas = sharp({
    create: {
      width: CANVAS_W,
      height: CANVAS_H,
      channels: 3,
      background: "#0F1117",
    },
  })
    .composite([{ input: headerBuf, top: 0, left: 0 }, ...tiles])
    .jpeg({ quality: 88 });

  const buf = await canvas.toBuffer();
  const key = `circle-day-cards/${circle.id}/${date.toISOString().slice(0, 10)}.jpg`;
  const url = await uploadComposite(buf, key);
  if (!url) return null;

  const stored = await prisma.dayCard.upsert({
    where: { circleId_date: { circleId: circle.id, date } },
    update: {
      imageUrl: url,
      momentIds: usable.map((m) => m.id),
      generatedAt: new Date(),
    },
    create: {
      circleId: circle.id,
      date,
      imageUrl: url,
      momentIds: usable.map((m) => m.id),
    },
  });
  return { id: stored.id, imageUrl: stored.imageUrl, date: stored.date };
}

/** Start of "yesterday" in `tz`, encoded as midnight UTC of that date. */
function startOfYesterdayLocal(tz: string): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? "0");
  const y = get("year");
  const m = get("month");
  const d = get("day");
  // Roll back one local day, then encode as UTC midnight of that ymd.
  const local = new Date(Date.UTC(y, m - 1, d));
  local.setUTCDate(local.getUTCDate() - 1);
  return local;
}
