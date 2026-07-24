import { test, expect } from "@playwright/test";

test.describe("Tokenizer Playground Local E2E", () => {
  test("should load the tiny tokenizer and tokenize text", async ({ page }) => {
    // 1. Navigate to the tokenizer app
    await page.goto("/tokenizer-playground");

    // 2. Click Start Model
    const startBtn = page.getByRole("button", { name: /Start Model/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 3. Wait for model to load and text input to become enabled/visible
    const textInput = page.getByPlaceholder("Enter some text...");
    await expect(textInput).toBeVisible();
    await expect(textInput).toBeEnabled();

    // 4. Send some text
    await textInput.fill("E2E test string!");

    // 5. Verify that token stats appear and tokens are displayed
    const changeModelBtn = page.getByRole("button", { name: /Change Model/i });
    await expect(changeModelBtn).toBeVisible();

    // We verify the text inside the token-output container to avoid matching the textarea
    const tokenOutput = page.getByTestId("token-output");
    await expect(tokenOutput.getByText("E2E")).toBeVisible();
    await expect(tokenOutput.getByText("test")).toBeVisible();
  });
});
