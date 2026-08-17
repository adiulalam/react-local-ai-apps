import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "path";

test.describe("Video Describer E2E", () => {
  test("should describe video scenes using local model", async ({ page }) => {
    // 1. Navigate to the video describer app
    await page.goto("/video-describer");

    // 2. Upload video file
    const fileInput = page.getByTestId("video-file-input");
    await fileInput.setInputFiles(path.join(process.cwd(), "public/sample/people-walking.mp4"));

    // 3. Start describing
    const startDescribingBtn = page.getByRole("button", { name: /Start Describing/i });
    await expect(startDescribingBtn).toBeVisible();
    await startDescribingBtn.click();

    // 4. Wait for processing and video rendering
    const video = page.getByTestId("describer-video");
    await expect(video).toBeVisible();

    // Play the video to ensure frames are available
    await video.evaluate((vid: HTMLVideoElement) => vid.play());

    // 5. Trigger scene description
    const describeBtn = page.getByRole("button", { name: /Describe Scene Now/i });
    await expect(describeBtn).toBeVisible();
    await describeBtn.click();

    // 6. Verify description is generated and displayed
    const descriptionText = page.getByTestId("description-text");
    await expect(descriptionText).toBeVisible();
    const text = await descriptionText.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);

    // Verify Narration Timeline heading is visible
    await expect(page.getByRole("heading", { level: 3, name: "Narration Timeline" })).toBeVisible();
  });
});

test.describe("Video Describer Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/video-describer");
    await expect(page.getByRole("heading", { level: 1, name: "AI Video Describer" })).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
