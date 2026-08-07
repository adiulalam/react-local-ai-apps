import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "path";

test.describe("Image Classifier E2E", () => {
  test("should classify image and generate caption using local model", async ({ page }) => {
    // 1. Navigate to the image classifier app
    await page.goto("/image-classifier");

    // 2. Upload image file
    const fileInput = page.getByTestId("image-file-input");
    await fileInput.setInputFiles(path.join(process.cwd(), "public/test-assets/dog-image.jfif"));

    // The image preview should appear with a Classification button
    const classificationBtn = page.getByRole("button", { name: /Classify image/i });
    await expect(classificationBtn).toBeVisible();
    await classificationBtn.click();

    // 3. Classification step
    // Wait for the classification to finish and 'Next: Generate Caption' button to appear
    const generateCaptionBtn = page.getByRole("button", { name: /Next: Generate Caption/i });
    await expect(generateCaptionBtn).toBeVisible();
    await generateCaptionBtn.click();

    // 4. Caption step
    // Wait for caption description to appear
    await expect(page.getByRole("heading", { name: "Caption Description", level: 3 })).toBeVisible();
    // Also expect some italic text which is the caption
    await expect(page.getByTestId("caption-text")).not.toBeEmpty();
  });
});

test.describe("Image Classifier Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/image-classifier");
    await expect(
      page.getByRole("heading", { level: 1, name: "Image Classification" })
    ).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
