import { test, expect } from "@playwright/test";
import path from "path";
import AxeBuilder from "@axe-core/playwright";

test.describe("Image Depth E2E", () => {
  test("should estimate depth map from image using local model", async ({ page }) => {
    // 1. Navigate to the image depth app
    await page.goto("/image-depth");

    // 2. Upload image file
    const fileInput = page.getByTestId("image-file-input");
    await fileInput.setInputFiles(
      path.join(process.cwd(), "public/test-assets/white-bckground-house.avif")
    );

    // The image preview should appear with an Estimate Depth button
    const estimateBtn = page.getByRole("button", { name: /Estimate Depth/i });
    await expect(estimateBtn).toBeVisible();
    await estimateBtn.click();

    // 3. Depth estimation step
    // Wait for the processing to finish and 'Download Depth PNG' button to appear
    const downloadBtn = page.getByRole("button", { name: /Download Depth PNG/i });
    await expect(downloadBtn).toBeVisible();

    // Verify the result depth map image is displayed
    const resultImage = page.getByAltText("Depth Map");
    await expect(resultImage).toBeVisible();
  });
});

test.describe("Image Depth Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/image-depth");
    await expect(
      page.getByRole("heading", { level: 1, name: "Image Depth Estimation" })
    ).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
