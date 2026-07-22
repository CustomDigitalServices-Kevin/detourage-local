import { expect, test } from "@playwright/test";

test("app loads and shows the local-first banner", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("local-banner")).toBeVisible();
  await expect(page).toHaveTitle(/Détourage local/);
});

test("no outgoing network request leaves the origin", async ({ page }) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "localhost") {
      externalRequests.push(request.url());
    }
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(externalRequests).toEqual([]);
});
