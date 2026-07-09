import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(2, "Slugul trebuie sa aiba cel putin 2 caractere.")
  .max(80, "Slugul este prea lung.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Foloseste litere mici, cifre si cratime."
  );

export const clientPayloadSchema = z.object({
  name: z.string().trim().min(2, "Numele clientului este obligatoriu."),
  slug: slugSchema,
  active: z.boolean().default(true),
  timezone: z.string().trim().min(1).default("Europe/Bucharest"),
  currency: z.string().trim().min(3).max(8).default("RON"),
  locale: z.enum(["ro", "en"]).default("ro"),
  reportType: z.enum(["lead", "ecommerce"]).default("lead"),
  websiteUrl: z.string().trim().optional().nullable(),
  logoUrl: z.string().trim().optional().nullable(),
  ga4PropertyId: z.string().trim().optional().nullable(),
  metaAdAccountId: z.string().trim().optional().nullable(),
  googleAdsSheetUrl: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  insightMonth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}$/)
    .optional()
    .nullable(),
  whatWentWell: z.string().trim().optional().nullable(),
  whatNeedsAttention: z.string().trim().optional().nullable(),
  recommendedNextActions: z.string().trim().optional().nullable()
});

export type ClientPayload = z.infer<typeof clientPayloadSchema>;

const optionalTrimmed = z.string().trim().optional().nullable();

export const adminSettingsPayloadSchema = z.object({
  publicAppUrl: optionalTrimmed.refine(
    (value) => !value || /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value),
    "URL-ul public trebuie sa inceapa cu http:// sau https://."
  ),
  metaAccessToken: optionalTrimmed,
  metaApiVersion: z
    .string()
    .trim()
    .regex(/^v?\d+\.\d+$/, "Versiunea Meta API trebuie sa arate ca v23.0.")
    .default("v23.0"),
  metaAppId: optionalTrimmed,
  metaAppSecret: optionalTrimmed,
  clearMetaAppSecret: z.boolean().default(false),
  ga4ClientEmail: optionalTrimmed,
  ga4PrivateKey: optionalTrimmed
});

export type AdminSettingsPayload = z.infer<typeof adminSettingsPayloadSchema>;

export function emptyToNull(value?: string | null) {
  return value?.trim() ? value.trim() : null;
}
