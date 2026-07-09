import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { hashToken } from "../lib/security/tokens";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.client.findUnique({
    where: { slug: "digitaldot-demo" }
  });

  const shareToken = existing?.shareTokenHash
    ? null
    : randomBytes(32).toString("base64url");

  const client = await prisma.client.upsert({
    where: { slug: "digitaldot-demo" },
    update: {
      name: "DigitalDot Demo",
      active: true,
      timezone: "Europe/Bucharest",
      currency: "RON",
      locale: "ro",
      websiteUrl: "https://digitaldot.ro",
      ga4PropertyId: "properties/123456789",
      metaAdAccountId: "act_123456789",
      googleAdsSheetUrl:
        "https://docs.google.com/spreadsheets/d/demo-sheet-id/edit",
      notes: "Demo client seeded for mock V1 reporting."
    },
    create: {
      name: "DigitalDot Demo",
      slug: "digitaldot-demo",
      active: true,
      timezone: "Europe/Bucharest",
      currency: "RON",
      locale: "ro",
      websiteUrl: "https://digitaldot.ro",
      ga4PropertyId: "properties/123456789",
      metaAdAccountId: "act_123456789",
      googleAdsSheetUrl:
        "https://docs.google.com/spreadsheets/d/demo-sheet-id/edit",
      notes: "Demo client seeded for mock V1 reporting.",
      shareTokenHash: shareToken ? hashToken(shareToken) : null
    }
  });

  const currentMonth = new Date().toISOString().slice(0, 7);

  await prisma.monthlyInsight.upsert({
    where: {
      clientId_month: {
        clientId: client.id,
        month: currentMonth
      }
    },
    update: {
      whatWentWell:
        "Campaniile cu intentie ridicata au pastrat un cost bun pe conversie.",
      whatNeedsAttention:
        "Traficul mobil are volum bun, dar conversiile sunt sub media contului.",
      recommendedNextActions:
        "Prioritizam bugetul pe campaniile performante si verificam paginile mobile."
    },
    create: {
      clientId: client.id,
      month: currentMonth,
      whatWentWell:
        "Campaniile cu intentie ridicata au pastrat un cost bun pe conversie.",
      whatNeedsAttention:
        "Traficul mobil are volum bun, dar conversiile sunt sub media contului.",
      recommendedNextActions:
        "Prioritizam bugetul pe campaniile performante si verificam paginile mobile."
    }
  });

  if (shareToken) {
    console.log(
      `Seeded demo report link: /client/digitaldot-demo/report?token=${shareToken}`
    );
  } else {
    console.log("Demo client already had a share token; leaving it unchanged.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
