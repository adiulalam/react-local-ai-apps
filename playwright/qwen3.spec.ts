import { test, expect } from "@playwright/test";

test.describe("Qwen3 Local E2E", () => {
  test("should load the tiny model and generate a dummy response", async ({ page }) => {
    test.setTimeout(60000); // Allow time for downloading and loading the dummy model

    // 1. Navigate to the qwen3 app
    await page.goto("/qwen3");

    // 2. Click Start Model
    const startBtn = page.getByRole("button", { name: /Start Model/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 3. Wait for model to load and chat input to become enabled
    const chatInput = page.getByPlaceholder("Type a message...");
    await expect(chatInput).toBeEnabled({ timeout: 60000 });

    const reasonBtn = page.getByRole("button", { name: /Reasoning/i });
    await expect(reasonBtn).toBeVisible();

    // 4. Send a message
    await chatInput.fill("Hello, world!");
    await chatInput.press("Enter");

    // 5. Verify that assistant responds
    const resetBtn = page.getByRole("button", { name: /Reset/i });
    await expect(resetBtn).toBeVisible({ timeout: 60000 });

    await expect(page.getByRole("button", { name: /Stop generation/i })).toHaveCount(0);

    const assistantMessages = page.getByTestId("assistant-message");
    await expect(assistantMessages.first()).toBeVisible();
  });
});
