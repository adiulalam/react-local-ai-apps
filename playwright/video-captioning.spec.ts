import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Video Captioning E2E", () => {
  test("should load sample video and caption it", async ({ page }) => {
    // 1. Navigate to the video captioning app
    await page.goto("/video-captioning");

    // 2. Select Sample Video
    const startCaptioningBtn = page.getByRole("button", { name: /Start Captioning/i });
    const sampleBtn = page.getByRole("button", { name: /Video Speech/i });
    await sampleBtn.click();

    await expect(startCaptioningBtn).toBeVisible();
    await startCaptioningBtn.click();

    // 3. Wait for processing and video rendering
    const video = page.getByTestId("result-video");

    // The processing step downloads the model and runs inference, which takes time
    await expect(video).toBeVisible();

    // 4. Verify captions are rendered when video plays
    // Play the video to trigger timeupdate events
    await video.evaluate((vid: HTMLVideoElement) => vid.play());

    // We expect some caption text to eventually appear in the span
    const captionSpan = page.getByTestId("caption-text");
    await expect(captionSpan).toBeVisible();

    // Ensure it actually has some text
    const text = await captionSpan.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
});

test.describe("Video Captioning Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/video-captioning");
    await expect(
      page.getByRole("heading", { level: 1, name: "AI Video Captioning" })
    ).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
