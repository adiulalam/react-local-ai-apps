import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Text to Music E2E", () => {
  test("should generate audio from text prompt using local model", async ({ page }) => {
    // 1. Navigate to the text to music app
    await page.goto("/text-to-music");

    // 2. Input prompt and generate
    const promptInput = page.getByRole("textbox");
    await promptInput.fill("80s synthwave pop track with energetic drums and retro synths");

    const generateBtn = page.getByRole("button", { name: /Generate Music/i });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // 3. Wait for generation to complete and export step to appear
    await expect(page.getByRole("heading", { name: "Generated Track" })).toBeVisible();

    // 4. Test Play functionality
    const playBtn = page.getByRole("button", { name: "Play" });
    await expect(playBtn).toBeVisible();
    await playBtn.click();
    await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();

    // 5. Test Download functionality
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download WAV" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/musicgen_.*\.wav/);
  });
});

test.describe("Text to Music Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/text-to-music");
    await expect(page.getByRole("heading", { level: 1, name: "Text to Music" })).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
