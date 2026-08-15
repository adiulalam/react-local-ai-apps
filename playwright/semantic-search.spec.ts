import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Semantic Search E2E", () => {
  test("should index document chunks and answer questions with local model", async ({ page }) => {
    // 1. Navigate to the semantic search app
    await page.goto("/semantic-search");

    // 2. Verify page heading
    await expect(
      page.getByRole("heading", { level: 1, name: "Local Semantic Search (RAG)" })
    ).toBeVisible();

    // 3. Select sample document from the Sample Documents tab
    const samplesTab = page.getByRole("tab", { name: /Sample Documents/i });
    await expect(samplesTab).toBeVisible();
    await samplesTab.click();

    const sampleCard = page.getByText("In-Browser AI & Local LLMs Whitepaper");
    await expect(sampleCard).toBeVisible();
    await sampleCard.click();

    // 4. Click Start Search & Chat to advance to Step 2
    const startSearchBtn = page.getByRole("button", { name: /Start Search & Chat/i });
    await expect(startSearchBtn).toBeVisible();
    await startSearchBtn.click();

    // 5. Wait for vector indexing to complete and search input to be ready
    const searchInput = page.getByPlaceholder(/Ask anything or search passages/i);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();

    // 6. Ask a question
    await searchInput.fill("What are the privacy advantages of client-side RAG?");

    const askBtn = page.getByRole("button", { name: "Ask AI", exact: true });
    await expect(askBtn).toBeEnabled();
    await askBtn.click();

    // 7. Verify assistant response and citations
    const assistantMessage = page.getByTestId("assistant-message");
    await expect(assistantMessage.first()).toBeVisible();
    await expect(assistantMessage.first()).not.toBeEmpty();

    // 8. Test tab navigation to Document Text & Live Highlights
    const documentTab = page.getByRole("tab", { name: /Document Text & Live Highlights/i });
    await expect(documentTab).toBeVisible();
    await documentTab.click();
    await expect(
      page.getByRole("tabpanel").getByText("Document Text & Live Highlights")
    ).toBeVisible();

    // 9. Switch back to chat tab
    const chatTab = page.getByRole("tab", { name: /AI Answers & Verified Sources/i });
    await expect(chatTab).toBeVisible();
    await chatTab.click();

    // 10. Test Export Report functionality
    const downloadPromise = page.waitForEvent("download");
    const exportBtn = page.getByRole("button", { name: /Export Report/i });
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/.*-report\.md/);
  });
});

test.describe("Semantic Search Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/semantic-search");
    await expect(
      page.getByRole("heading", { level: 1, name: "Local Semantic Search (RAG)" })
    ).toBeVisible();

    const step1ScanResults = await new AxeBuilder({ page }).analyze();
    expect(step1ScanResults.violations).toEqual([]);

    // Advance to Step 2
    const samplesTab = page.getByRole("tab", { name: /Sample Documents/i });
    await samplesTab.click();

    const sampleCard = page.getByText("In-Browser AI & Local LLMs Whitepaper");
    await sampleCard.click();

    const startSearchBtn = page.getByRole("button", { name: /Start Search & Chat/i });
    await startSearchBtn.click();

    const searchInput = page.getByPlaceholder(/Ask anything or search passages/i);
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();

    const step2ScanResults = await new AxeBuilder({ page }).analyze();
    expect(step2ScanResults.violations).toEqual([]);
  });
});
