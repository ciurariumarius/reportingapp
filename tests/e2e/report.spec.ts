import { expect, test } from "@playwright/test";

test("client report is public by slug", async ({ page }) => {
  await page.goto("/r/digitaldot-demo");
  await expect(page.getByText("DigitalDot Demo")).toBeVisible();
});
