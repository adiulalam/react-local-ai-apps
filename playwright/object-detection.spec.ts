import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "path";

test.describe("Object Detection E2E", () => {
  test("should detect objects in video using local model", async ({ page }) => {
    // 1. Navigate to the object detection app
    await page.goto("/object-detection");

    // 2. Upload video file
    const fileInput = page.getByTestId("video-file-input");
    await fileInput.setInputFiles(
      path.join(process.cwd(), "public/test-assets/people-walking.mp4")
    );

    // 3. Start detection
    const startDetectionBtn = page.getByRole("button", { name: /Start Detection/i });
    await expect(startDetectionBtn).toBeVisible();
    await startDetectionBtn.click();

    // 4. Wait for processing and canvas rendering
    // The video and canvas should be visible once processing starts
    const video = page.getByTestId("detection-video");
    const canvas = page.getByTestId("detection-canvas");

    await expect(video).toBeVisible();
    await expect(canvas).toBeVisible();
  });
});

test.describe("Object Detection Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/object-detection");
    await expect(
      page.getByRole("heading", { level: 1, name: "AI Video Object Detection" })
    ).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
