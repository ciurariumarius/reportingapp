import "server-only";

import { getServerSetting } from "./app-settings";
import { hasReportAccess } from "./auth";
import { prisma } from "./prisma";
import { verifyPassword } from "./security/passwords";
import { safeEqual } from "./security/tokens";

export const DEFAULT_REPORT_PIN = "2657";

export async function verifyReportPin(slug: string, pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    return false;
  }

  const client = await prisma.client.findFirst({
    where: { slug, active: true },
    select: {
      reportPinHash: true
    }
  });

  if (!client) {
    return false;
  }

  if (client.reportPinHash) {
    return verifyPassword(pin, client.reportPinHash);
  }

  const globalPin = (await getServerSetting("REPORT_DEFAULT_PIN")) || DEFAULT_REPORT_PIN;
  return safeEqual(pin, globalPin);
}

export async function canReadReport(slug: string) {
  return hasReportAccess(slug);
}
