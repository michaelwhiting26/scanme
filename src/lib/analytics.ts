import "server-only";
import { prisma } from "./db";
import { getGeo, parseAgent, visitorHash } from "./request";

// Ingest a single scan. Designed to be fast and write-bounded:
//  1. determine uniqueness (cheap indexed lookup on (qrCodeId, visitorHash))
//  2. insert the raw event
//  3. increment the per-day rollup (upsert)
// Steps 2+3 run in one transaction so the dashboard rollups never drift.
export async function recordScan(qrCodeId: string, headers: Headers) {
  const ua = headers.get("user-agent") ?? "";
  const agent = parseAgent(ua);
  const hash = visitorHash(headers, qrCodeId);
  const geo = getGeo(headers);
  const referer = headers.get("referer") ?? undefined;

  const prior = await prisma.scanEvent.findFirst({
    where: { qrCodeId, visitorHash: hash },
    select: { id: true },
  });
  const isUnique = !prior;

  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    await tx.scanEvent.create({
      data: {
        qrCodeId,
        visitorHash: hash,
        isUnique,
        isBot: agent.isBot,
        device: agent.device,
        os: agent.os,
        browser: agent.browser,
        country: geo.country,
        region: geo.region,
        city: geo.city,
        referer,
      },
    });

    // Bots are recorded but excluded from headline rollups.
    if (agent.isBot) return;

    const existing = await tx.scanDaily.findUnique({
      where: { qrCodeId_day: { qrCodeId, day } },
    });
    const devices = (existing?.devices as Record<string, number>) ?? {};
    const countries = (existing?.countries as Record<string, number>) ?? {};
    devices[agent.device] = (devices[agent.device] ?? 0) + 1;
    if (geo.country) countries[geo.country] = (countries[geo.country] ?? 0) + 1;

    await tx.scanDaily.upsert({
      where: { qrCodeId_day: { qrCodeId, day } },
      create: {
        qrCodeId,
        day,
        scans: 1,
        uniqueScans: isUnique ? 1 : 0,
        devices,
        countries,
      },
      update: {
        scans: { increment: 1 },
        uniqueScans: isUnique ? { increment: 1 } : undefined,
        devices,
        countries,
      },
    });
  });

  return { isUnique, isBot: agent.isBot };
}

export type Range = "today" | "7d" | "30d" | "all";

function rangeStart(range: Range): Date | undefined {
  if (range === "all") return undefined;
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  if (range === "7d") d.setUTCDate(d.getUTCDate() - 6);
  if (range === "30d") d.setUTCDate(d.getUTCDate() - 29);
  return d;
}

export interface DashboardStats {
  totalScans: number;
  uniqueScans: number;
  series: { day: string; scans: number; unique: number }[];
  devices: Record<string, number>;
  countries: Record<string, number>;
}

export async function getStats(
  qrCodeIds: string[],
  range: Range,
): Promise<DashboardStats> {
  if (qrCodeIds.length === 0)
    return { totalScans: 0, uniqueScans: 0, series: [], devices: {}, countries: {} };

  const start = rangeStart(range);
  const rows = await prisma.scanDaily.findMany({
    where: { qrCodeId: { in: qrCodeIds }, ...(start ? { day: { gte: start } } : {}) },
    orderBy: { day: "asc" },
  });

  const byDay = new Map<string, { scans: number; unique: number }>();
  const devices: Record<string, number> = {};
  const countries: Record<string, number> = {};
  let totalScans = 0;
  let uniqueScans = 0;

  for (const r of rows) {
    const key = r.day.toISOString().slice(0, 10);
    const agg = byDay.get(key) ?? { scans: 0, unique: 0 };
    agg.scans += r.scans;
    agg.unique += r.uniqueScans;
    byDay.set(key, agg);
    totalScans += r.scans;
    uniqueScans += r.uniqueScans;
    for (const [k, v] of Object.entries(r.devices as Record<string, number>))
      devices[k] = (devices[k] ?? 0) + v;
    for (const [k, v] of Object.entries(r.countries as Record<string, number>))
      countries[k] = (countries[k] ?? 0) + v;
  }

  const series = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, scans: v.scans, unique: v.unique }));

  return { totalScans, uniqueScans, series, devices, countries };
}
