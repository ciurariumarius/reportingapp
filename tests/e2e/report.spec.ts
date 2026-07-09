import { expect, test } from "@playwright/test";

test("client report is public by slug", async ({ page }) => {
  await page.goto("/r/digitaldot-demo");
  await expect(page.getByText("DigitalDot Demo")).toBeVisible();
  await expect(page.getByText("Ce optimizăm mai departe")).toBeVisible();
  await expect(page.getByText("Detalii Google Ads")).toBeVisible();
  await expect(page.getByText("Status tehnic și sincronizare date")).toBeVisible();
  await expect(page.getByText("Campanii").first()).toBeHidden();
});
