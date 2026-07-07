import { expect, test } from "@playwright/test";

test("client report requires a valid secret link", async ({ page }) => {
  await page.goto("/client/digitaldot-demo/report");
  await expect(page.getByText("Acces restrictionat")).toBeVisible();
});
