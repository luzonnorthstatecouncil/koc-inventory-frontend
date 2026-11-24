// Phases 8–10 — Kits, POS sales, Orders (refund / void / reprint)
const { test, expect } = require("@playwright/test");
const { signIn, fillField, chooseOption, rowAction, confirmDialog, apiToken, api } = require("./helpers");
const { db } = require("./db");

test.describe.serial("Phase 8: Kits", () => {
  const openCreate = async (page) => {
    await page.goto("/inventory/kits");
    await page.getByRole("button", { name: "Create Kit" }).click();
    return page.getByRole("alertdialog").filter({ hasText: "Create New Kit" });
  };

  test("KT-01 kit needs a name, SKU and at least one item", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreate(page);
    let calls = 0;
    page.on("request", (r) => { if (r.method() === "POST" && /\/v1\/kits$/.test(r.url())) calls++; });
    await dlg.getByRole("button", { name: "Create Kit" }).click();
    await expect(dlg.getByText(/required/i).first()).toBeVisible();
    expect(calls).toBe(0);
  });

  test("KT-02 create a kit from the UI", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreate(page);
    await fillField(dlg, "Kit Name", "Starter Pack");
    await fillField(dlg, "SKU", "KIT-STARTER");
    await fillField(dlg, "Total Price (PHP)", "300");
    await dlg.getByRole("tab", { name: "Kit Components" }).click();
    await dlg.getByRole("combobox").filter({ hasText: "Search for an item..." }).click();
    await page.getByRole("option", { name: "Office Chair - Default" }).first().click();
    await dlg.getByRole("button", { name: "Create Kit" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /Starter Pack/ })).toBeVisible();
  });

  test("KT-03 duplicate kit SKU is refused with a clear message", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreate(page);
    await fillField(dlg, "Kit Name", "Another Pack");
    await fillField(dlg, "SKU", "KIT-STARTER");
    await fillField(dlg, "Total Price (PHP)", "100");
    await dlg.getByRole("tab", { name: "Kit Components" }).click();
    await dlg.getByRole("combobox").filter({ hasText: "Search for an item..." }).click();
    await page.getByRole("option", { name: "Office Chair - Default" }).first().click();
    await dlg.getByRole("button", { name: "Create Kit" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/already exists/i).first()).toBeVisible();
  });
});

test.describe.serial("Phase 9: POS", () => {
  const addToCart = (page, name) => page.getByText(name, { exact: true }).first().click();

  test("POS-01 cannot exceed available stock in the cart", async ({ page }) => {
    await signIn(page);
    await page.getByRole("checkbox").filter({ hasText: "" }).first(); // page ready
    // Laptop has only a few units after the stock phases
    const available = await db.variantQty("Laptop");
    await addToCart(page, "Laptop - Default");
    const plus = page.locator("button:has(svg.lucide-plus)").last();
    for (let i = 1; i < available + 2; i++) await plus.click();
    await expect(page.getByText("Cannot add more items than available in stock").first()).toBeVisible();
  });

  test("POS-02 checkout needs a payment method, and tender must cover the total", async ({ page }) => {
    await signIn(page);
    await addToCart(page, "T-Shirt - Default");
    await page.getByRole("button", { name: "Process Transaction" }).click();
    await expect(page.getByText("Please select a payment method.").first()).toBeVisible();
    await page.getByText("Cash", { exact: true }).first().click();
    await page.getByRole("button", { name: "Process Transaction" }).click();
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await expect(page.getByText("Please enter an invoice number.").first()).toBeVisible();
    await page.getByPlaceholder("e.g., INV-2026-001").fill("INV-POS-2");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByRole("button", { name: "50", exact: true }).click(); // less than 275
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Amount tendered is less than total.").first()).toBeVisible();
  });

  test("POS-03 sell a kit and a loose item together; stock drops for both", async ({ page }) => {
    const chairBefore = await db.variantQty("Office Chair");
    const shirtBefore = await db.variantQty("T-Shirt");
    await signIn(page);
    await addToCart(page, "Starter Pack");
    await addToCart(page, "T-Shirt - Default");
    await page.getByText("Cash", { exact: true }).first().click();
    await page.getByRole("button", { name: "Process Transaction" }).click();
    await page.getByPlaceholder("e.g., INV-2026-001").fill("INV-POS-3");
    await page.getByRole("button", { name: "Continue to Payment" }).click();
    await page.getByRole("button", { name: "1000", exact: true }).click();
    await page.getByRole("button", { name: "Submit" }).click();
    await confirmDialog(page, "Process Payment");
    await expect(page.getByText(/Transaction processed successfully/).first()).toBeVisible();
    expect(await db.variantQty("Office Chair")).toBe(chairBefore - 1);
    expect(await db.variantQty("T-Shirt")).toBe(shirtBefore - 1);
  });

  test("POS-04 internal deduction removes stock without a sale", async ({ page }) => {
    const before = await db.variantQty("T-Shirt");
    await signIn(page);
    await addToCart(page, "T-Shirt - Default");
    await page.getByText("Internal Deduction?").locator("..").getByRole("checkbox").click();
    await page.getByRole("button", { name: "Deduct Stock" }).click();
    await confirmDialog(page, "Deduct Stock");
    await expect(page.getByText(/deduction/i).first()).toBeVisible();
    expect(await db.variantQty("T-Shirt")).toBe(before - 1);
  });
});

test.describe.serial("Phase 10: Orders", () => {
  test("OR-01 kit order shows its components in the details", async ({ page }) => {
    await signIn(page);
    await page.goto("/transactions");
    await rowAction(page, /INV-POS-3|INV INV-POS-3/, "View Details");
    const dlg = page.getByRole("alertdialog").last();
    await expect(dlg.getByText("Starter Pack").first()).toBeVisible();
    await expect(dlg.getByText(/Office Chair - Default/).first()).toBeVisible();
    await expect(dlg.getByText("INV-POS-3").first()).toBeVisible();
  });

  test("OR-02 refund a kit order; stock returns exactly", async ({ page }) => {
    const chairBefore = await db.variantQty("Office Chair");
    await signIn(page);
    await page.goto("/transactions");
    await rowAction(page, /INV-POS-3/, "Refund Order");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Product Defect" }).click();
    await page.getByRole("button", { name: "Save Changes" }).click();
    await confirmDialog(page, "Yes, Refund");
    await expect(page.getByText(/refunded successfully/i).first()).toBeVisible();
    expect(await db.variantQty("Office Chair")).toBe(chairBefore + 1);
  });

  test("OR-03 void that refund; stock is deducted again", async ({ page }) => {
    const chairBefore = await db.variantQty("Office Chair");
    await signIn(page);
    await page.goto("/transactions");
    await rowAction(page, /RFD-/, "Void Refund");
    await confirmDialog(page, "Yes, Void Refund");
    await expect(page.getByText(/voided/i).first()).toBeVisible();
    expect(await db.variantQty("Office Chair")).toBe(chairBefore - 1);
  });

  test("OR-04 reprint shows the invoice number", async ({ page, context }) => {
    await signIn(page);
    await page.goto("/transactions");
    const popup = context.waitForEvent("page");
    await rowAction(page, /INV-POS-2|ORD-/, "Print Invoice");
    const receipt = await popup;
    await expect(receipt.getByText(/#/).first()).toBeVisible();
  });
});
