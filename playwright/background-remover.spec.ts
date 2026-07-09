import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Background Remover E2E", () => {
  test("should remove background from image using local WebGPU model", async ({ page }) => {
    // Increase timeout since downloading the model and processing takes time
    test.setTimeout(60000);

    // 1. Navigate to the background remover app
    await page.goto("/background-remover");

    // 2. Upload image file
    const fileInput = page.getByTestId("image-file-input");
    await fileInput.setInputFiles(
      path.join(process.cwd(), "public/test-assets/white-bckground-house.avif")
    );

    // The image preview should appear with a Remove Background button
    const removeBtn = page.getByRole("button", { name: /Remove Background/i });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // 3. Removal step
    // Wait for the processing to finish and 'Download PNG' button to appear
    const downloadBtn = page.getByRole("button", { name: /Download PNG/i });
    await expect(downloadBtn).toBeVisible({ timeout: 60000 });

    // Verify the result image is displayed
    const resultImage = page.getByAltText("Background Removed");
    await expect(resultImage).toBeVisible();
  });
});
