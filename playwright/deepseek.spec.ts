import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Deepseek Local E2E", () => {
  test("should load the tiny model and generate a dummy response", async ({ page }) => {
    // 1. Navigate to the deepseek app
    await page.goto("/deepseek");

    // 2. Click Start Model
    const startBtn = page.getByRole("button", { name: /Start Model/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 3. Wait for model to load and chat input to become enabled
    const chatInput = page.getByPlaceholder("Type a message...");
    await expect(chatInput).toBeEnabled();

    const reasonBtn = page.getByRole("button", { name: /Reasoning/i });
    await expect(reasonBtn).toBeVisible();

    // 4. Send a message
    await chatInput.fill("Hello, world!");
    await chatInput.press("Enter");

    // 5. Verify that assistant responds
    const resetBtn = page.getByRole("button", { name: /Reset/i });
    await expect(resetBtn).toBeVisible();

    await expect(page.getByRole("button", { name: /Stop generation/i })).toHaveCount(0);

    const assistantMessages = page.getByTestId("assistant-message");
    await expect(assistantMessages.first()).toBeVisible();
  });
});

test.describe("Deepseek Local Accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/deepseek");
    await expect(page.getByRole("heading", { level: 1, name: "DeepSeek R1 - 1.5B" })).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
