import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Local Scribe E2E', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

  test('should transcribe and summarize audio using local model', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Navigate to the scribe app
    await page.goto('/scribe');

    // 2. Upload audio file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(process.cwd(), 'public/test-assets/test-audio.wav'));

    // Wait for the transcription step to finish and the 'Continue to Summarization' button to become enabled
    const continueToSummarizationBtn = page.getByRole('button', { name: /Continue to Summarization/i });
    await expect(continueToSummarizationBtn).toBeEnabled({ timeout: 60000 });
    await continueToSummarizationBtn.click();

    // 3. Summarization step
    // Click Generate Summary
    const generateSummaryBtn = page.getByRole('button', { name: /Generate Summary/i });
    await generateSummaryBtn.click();

    // Wait for summarization to complete
    const continueToExportBtn = page.getByRole('button', { name: /Continue to Export/i });
    await expect(continueToExportBtn).toBeEnabled({ timeout: 60000 });
    await continueToExportBtn.click();

    // 4. Export step
    await expect(page.getByText('Final Summary')).toBeVisible();
    await expect(page.getByText('Raw Transcription')).toBeVisible();

    // Test Copy functionality
    await page.getByRole('button', { name: 'Copy' }).first().click();
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.length).toBeGreaterThan(0);

    // Test Download functionality
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).first().click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/local_scribe_.*\.txt/);
  });
});
