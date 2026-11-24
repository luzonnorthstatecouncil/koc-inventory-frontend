// Phases 11–12 — Reports, stock movements, audit logs, account/profile
const { test, expect } = require("@playwright/test");
const { signIn, watch, uiLogin, confirmDialog } = require("./helpers");

test.describe.serial("Phase 11: Reports, movements, audit logs", () => {
  test("RP-01 reports page loads its cards and both tabs without errors", async ({ page }) => {
    const issues = watch(page);
    await signIn(page);
    await page.goto("/reports");
    await expect(page.getByText("Total Inventory Value").first()).toBeVisible();
    await page.getByRole("tab", { name: "Stocks Velocity" }).click();
    // Which items appear depends on net sales; what must hold is that the page footer matches
    // the rows shown (items hidden while "calibrating" used to be counted but not listed)
    const panel = page.getByRole("tabpanel", { name: "Stocks Velocity" });
    const footer = panel.getByText(/Showing \d+ to \d+ of \d+ entries/);
    await expect(footer).toBeVisible();
    const [, from, to] = (await footer.textContent()).match(/Showing (\d+) to (\d+)/).map(Number);
    await expect(panel.getByRole("rowgroup").last().getByRole("row")).toHaveCount(to - from + 1);
    await page.getByRole("tab", { name: "Reorder Report" }).click();
    expect(issues.filter((i) => !/DevTools|Future Flag/.test(i))).toEqual([]);
  });

  test("RP-02 inventory summary export downloads a spreadsheet", async ({ page }) => {
    await signIn(page);
    await page.goto("/reports");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /Export/i }).first().click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.xlsx$/);
  });

  test("RP-03 movements filter by type shows only that type", async ({ page }) => {
    await signIn(page);
    await page.goto("/inventory/movements");
    await expect(page.getByText("Stock Out").first()).toBeVisible();
    const typeSelect = page.getByRole("combobox").filter({ hasText: "Select Movement Type" });
    await typeSelect.click();
    await page.getByRole("option", { name: "Stock In (Add)" }).click();
    await page.waitForTimeout(800);
    const rows = page.getByRole("row");
    await expect(rows.filter({ hasText: "Stock Out" })).toHaveCount(0);
    await expect(rows.filter({ hasText: "Stock In" }).first()).toBeVisible();
  });

  test("RP-04 orders export downloads a spreadsheet", async ({ page }) => {
    await signIn(page);
    await page.goto("/transactions");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Current List" }).click();
    expect((await download).suggestedFilename()).toMatch(/orders-export-.*\.xlsx$/);
  });

  test("RP-05 audit logs list actions from the earlier phases and search works", async ({ page }) => {
    await signIn(page);
    await page.goto("/audit-logs");
    // Page 1 is mostly the tests' own logins, so search for the actions instead
    const search = page.getByPlaceholder(/Search/i).first();
    await search.fill("Approve Request");
    await expect(page.getByRole("cell", { name: "Approve Request" }).first()).toBeVisible();
    // Refunds must be logged as refunds (a trailing slash used to log them as "Checkout Order")
    await search.fill("Refunded Order");
    await expect(page.getByRole("cell", { name: "Refund Order" }).first()).toBeVisible();
  });
});

test.describe.serial("Phase 12: Account", () => {
  // Edit lives in the section header; inputs appear in the section body once editing
  const startEdit = async (page, title) => {
    await page.getByText(title, { exact: true }).locator("xpath=ancestor::div[.//button[normalize-space()='Edit']][1]").getByRole("button", { name: "Edit" }).click();
    return page.locator("div").filter({ has: page.getByText(title, { exact: true }) }).filter({ has: page.locator("input:not([disabled])") }).last();
  };

  test("AC-01 update full name from the Account page", async ({ page }) => {
    await signIn(page, "sup_ui", "suppass1");
    await page.goto("/account");
    const s = await startEdit(page, "Personal information");
    const name = s.locator("input").first();
    await name.fill("Samantha Supervisor");
    await s.getByRole("button", { name: "Save Changes" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/Profile updated successfully/i).first()).toBeVisible();
  });

  test("AC-02 one-character name is rejected", async ({ page }) => {
    await signIn(page, "sup_ui", "suppass1");
    await page.goto("/account");
    const s = await startEdit(page, "Personal information");
    await s.locator("input").first().fill("S");
    await s.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText(/at least 2 characters/i).first()).toBeVisible();
  });

  test("AC-03 username already taken is refused", async ({ page }) => {
    await signIn(page, "sup_ui", "suppass1");
    await page.goto("/account");
    const s = await startEdit(page, "Account details");
    await s.locator("input").first().fill("admin");
    await s.getByRole("button", { name: "Save Changes" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/already taken/i).first()).toBeVisible();
  });

  test("AC-04 renaming your username keeps you signed in and the new name works", async ({ page, browser }) => {
    await signIn(page, "sup_ui", "suppass1");
    await page.goto("/account");
    const s = await startEdit(page, "Account details");
    await s.locator("input").first().fill("sup_renamed");
    await s.getByRole("button", { name: "Save Changes" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
    await page.reload();
    await expect(page.getByText("sup_renamed").first()).toBeVisible();
    const other = await browser.newPage();
    await uiLogin(other, "sup_renamed", "suppass1");
    await expect(other).toHaveURL(/\/sales/);
    await other.close();
  });
});
