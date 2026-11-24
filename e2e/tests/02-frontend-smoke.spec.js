// Frontend smoke after optimization/cleanup: lazy pages load cleanly, POS sale + receipt,
// refund keeps "Other" details, dropdowns request all suppliers.
const { test, expect } = require("@playwright/test");
const { uiLogin, apiToken, api, watch, ensureShiftOpen } = require("./helpers");

const PAGES = [
  ["/sales", "Current sale"],
  ["/transactions", "Transaction History"],
  ["/inventory/items", "Items"],
  ["/inventory/stocks", "Inventory Stocks"],
  ["/inventory/kits", "Kits"],
  ["/inventory/movements", "Movements"],
  ["/inventory/suppliers", "Suppliers"],
  ["/inventory/approvals", "Approvals"],
  ["/user-management", "User Management"],
  ["/reports", "Reports"],
  ["/audit-logs", "Audit Logs"],
  ["/account", "Account"],
];

test.describe("Frontend smoke", () => {
  test("S-01 every page loads its lazy chunk without errors", async ({ page }) => {
    const issues = watch(page);
    await uiLogin(page, "admin", "test");
    await expect(page).toHaveURL(/\/sales/);
    for (const [path, text] of PAGES) {
      await page.goto(path);
      await expect(page.getByText(text).first(), `${path} rendered`).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Oops! Something went wrong")).toHaveCount(0);
    }
    const real = issues.filter((i) => !/React DevTools|Future Flag|externalized for browser/.test(i));
    expect(real, real.join("\n")).toEqual([]);
  });

  test("S-02 POS sale with invoice number, receipt opens, order recorded", async ({ page, context, request }) => {
    await uiLogin(page, "admin", "test");
    await expect(page).toHaveURL(/\/sales/);
    await ensureShiftOpen(page); // the till needs an open shift
    await page.getByRole("button", { name: /^Add T-Shirt - Default,/ }).first().click();
    await page.getByPlaceholder("e.g. 20481").fill("inv-smoke-1");
    await page.getByRole("button", { name: "₱500", exact: true }).click();
    const popup = context.waitForEvent("page");
    await page.getByRole("button", { name: /^Charge/ }).click();
    await expect(page.getByText("Sale recorded")).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Current sale" })).toContainText(/Change due\s*PHP 250\.00/);
    const receipt = await popup;
    await expect(receipt.getByText(/INV-SMOKE-1/i).first()).toBeVisible();

    const token = await apiToken(request, "admin", "test");
    const orders = await api(request, token, "GET", "/orders?search=INV-SMOKE-1");
    expect(orders.body.data.length).toBe(1);
    expect(Number(orders.body.data[0].payments.change_given)).toBe(250);
  });

  test("S-03 refund with reason 'Other' keeps the typed details", async ({ page, request }) => {
    await uiLogin(page, "admin", "test");
    await expect(page).toHaveURL(/\/sales/); // wait for the session before navigating
    await page.goto("/transactions");
    const row = page.getByRole("row", { name: /INV SMOKE|INV-SMOKE-1|ORD-/i }).first();
    await row.getByRole("button").last().click();
    await page.getByRole("menuitem", { name: "Refund Order" }).click();
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Other" }).click();
    await page.getByPlaceholder(/Customer requested a refund/).fill("Box arrived crushed");
    await page.getByRole("button", { name: /^Refund PHP / }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Yes, Refund" }).click();
    await expect(page.getByText(/refunded successfully/i).first()).toBeVisible();

    const token = await apiToken(request, "admin", "test");
    const order = (await api(request, token, "GET", "/orders?search=RFD-")).body.data[0];
    expect(order.refund_reason).toBe("Other: Box arrived crushed");
  });

  test("S-04 stock form requests all suppliers (pageSize=1000, was cut to 25)", async ({ page }) => {
    await uiLogin(page, "admin", "test");
    await expect(page).toHaveURL(/\/sales/); // wait for the session before navigating
    await page.goto("/inventory/stocks");
    const supplierReq = page.waitForRequest((r) => r.url().includes("/v1/supplier?"));
    await page.getByRole("button", { name: "Create New Stock" }).click();
    const url = (await supplierReq).url();
    expect(url).toContain("pageSize=1000");
  });
});
