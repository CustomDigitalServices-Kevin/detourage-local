import { expect, test } from "@playwright/test";

// Main navigation journey through the real built app (vite preview). The heavy
// ONNX inference is deliberately out of scope for E2E (it downloads tens of MB
// and needs WebGPU/WASM); these cover the shell the user always touches first:
// language switching and static-page navigation.

// Pin the browser language so detectLocale() boots the app in French
// deterministically (a default Chromium reports en-US and would start in
// English). The FR↔EN toggle itself is still exercised by the first test.
test.use({ locale: "fr-FR" });

test("switches the whole UI between French and English", async ({ page }) => {
  await page.goto("/");

  // Default locale is French: hero title + FR banner, toggle offers EN.
  await expect(page.getByRole("heading", { level: 1, name: "Détourage local" })).toBeVisible();
  const toggle = page.getByTestId("locale-toggle");
  await expect(toggle).toHaveText("EN");

  await toggle.click();

  // Now English throughout, and the toggle offers switching back to FR.
  await expect(
    page.getByRole("heading", { level: 1, name: "Local Background Remover" }),
  ).toBeVisible();
  await expect(toggle).toHaveText("FR");
});

test("navigates to the Privacy page and back home", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Confidentialité et RGPD" }).click();

  // Privacy page content is shown; the home dropzone is gone.
  await expect(page.getByRole("heading", { name: "Vos images restent chez vous" })).toBeVisible();
  await expect(page.getByTestId("dropzone")).toHaveCount(0);

  await page.getByRole("button", { name: "Retour à l'accueil" }).click();

  // Back on the home page: the local-first banner and dropzone are visible again.
  await expect(page.getByTestId("local-banner")).toBeVisible();
  await expect(page.getByTestId("dropzone")).toBeVisible();
});
