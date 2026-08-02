import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Voice Cloning E2E", () => {
  test("should clone voice from text prompt and sample audio", async ({ page }) => {
    // 1. Navigate to the voice cloning app
    await page.goto("/voice-cloning");

    // 2. Select sample voice
    const selectSampleBtn = page.getByRole("button", {
      name: "Select sample Reference Voice Recording",
    });
    await expect(selectSampleBtn).toBeVisible();
    await selectSampleBtn.click();

    // 3. Continue with this voice
    const continueBtn = page.getByRole("button", { name: /Continue with this voice/i });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // 4. Enter prompt and generate
    const promptTextarea = page.getByLabel(/Speech Text Prompt/i);
    await promptTextarea.fill("This is a voice cloning test.");

    const generateBtn = page.getByRole("button", { name: /Generate Cloned Speech/i });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 5. Wait for generation to complete and export step to appear
    await expect(page.getByRole("heading", { name: "Generated Cloned Speech" })).toBeVisible();

    // 6. Test Play functionality
    const playBtn = page.getByRole("button", { name: "Play" });
    await expect(playBtn).toBeVisible();
    await playBtn.click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

    // 7. Test Download functionality
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download WAV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/voice_cloned_.*\.wav/);
  });
});

test.describe("Voice Cloning Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/voice-cloning");
    await expect(page.getByRole("heading", { level: 1, name: "Voice Cloning" })).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
