import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("TranslateGemma Local E2E", () => {
  test("should load the model and translate text", async ({ page }) => {
    // 1. Navigate to the translate-gemma app
    await page.goto("/translate-gemma");

    // 2. Verify heading
    await expect(page.getByRole("heading", { level: 1, name: "TranslateGemma" })).toBeVisible();

    // 3. Click Start Model
    const startBtn = page.getByRole("button", { name: /Start Model/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 4. Wait for model to load and source text area to become visible & enabled
    const sourceInput = page.getByPlaceholder("Type or paste text to translate...");
    await expect(sourceInput).toBeVisible();
    await expect(sourceInput).toBeEnabled();

    // 5. Enter text to translate
    await sourceInput.fill("Hello, welcome to local AI translation!");

    // 6. Click Translate button
    const translateBtn = page.getByRole("button", { name: /Translate/i });
    await expect(translateBtn).toBeVisible();
    await translateBtn.click();

    // 7. Verify translation completes, output text appears in target box, and copy button is enabled
    const copyBtn = page.getByRole("button", { name: /Copy/i });
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeEnabled();

    // 8. Verify destination output textbox renders translated text
    const targetOutput = page.getByTestId("target-translation-output");
    await expect(targetOutput).toBeVisible();
    await expect(targetOutput).toHaveText("mock");
  });
});

test.describe("TranslateGemma Local Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/translate-gemma");
    await expect(page.getByRole("heading", { level: 1, name: "TranslateGemma" })).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    const startBtn = page.getByRole("button", { name: /Start Model/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    const sourceInput = page.getByPlaceholder("Type or paste text to translate...");
    await expect(sourceInput).toBeEnabled();

    const loadedScanResults = await new AxeBuilder({ page }).analyze();
    expect(loadedScanResults.violations).toEqual([]);
  });
});
