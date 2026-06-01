import { PrismaClient } from "@prisma/client";
import { getThemeConfig } from "../src/lib/qr/themes";
import { instagramUrl } from "../src/lib/validation";

const prisma = new PrismaClient();

// Seeds a demo account with a couple of codes and synthetic scan history so the
// dashboard isn't empty in a fresh environment.
async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@scanme.app" },
    update: {},
    create: { email: "demo@scanme.app", name: "Demo Creator", plan: "PRO" },
  });

  for (const handle of ["johnsmith", "studio.neon"]) {
    const themeId = handle === "johnsmith" ? "aurora" : "neon-pulse";
    const qr = await prisma.qrCode.create({
      data: {
        userId: user.id,
        handle,
        targetUrl: instagramUrl(handle),
        themeId,
        design: getThemeConfig(themeId) as object,
        title: `@${handle}`,
      },
    });

    // 30 days of synthetic rollups.
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const day = new Date(today);
      day.setUTCHours(0, 0, 0, 0);
      day.setUTCDate(day.getUTCDate() - i);
      const scans = Math.floor(5 + Math.sin(i / 3) * 4 + Math.random() * 8);
      const unique = Math.floor(scans * 0.7);
      await prisma.scanDaily.create({
        data: {
          qrCodeId: qr.id,
          day,
          scans,
          uniqueScans: unique,
          devices: { mobile: Math.floor(scans * 0.8), desktop: scans - Math.floor(scans * 0.8) },
          countries: { US: Math.floor(scans * 0.6), GB: Math.floor(scans * 0.4) },
        },
      });
    }
  }
  console.log("Seeded demo data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
