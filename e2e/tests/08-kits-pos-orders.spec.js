// Phases 8–10 — Kits, POS sales, Orders (refund / void / reprint)
const { test, expect } = require("@playwright/test");
const { signIn, fillField, chooseOption, rowAction, confirmDialog, apiToken, api, ensureShiftOpen } = require("./helpers");
const { db } = require("./db");

test.describe.serial("Phase 8: Kits", () => {
  const openCreate = async (page) => {
    await page.goto("/inventory/kits");
    await page.getByRole("button", { name: "Create Kit" }).click();
    return page.getByRole("alertdialog").filter({ hasText: "Combine items into a bundle" });
  };

  test("KT-01 kit needs a name, SKU and at least one item", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreate(page);
    let calls = 0;
    page.on("request", (r) => { if (r.method() === "POST" && /\/v1\/kits$/.test(r.url())) calls++; });
    await dlg.getByRole("button", { name: "Create kit" }).click();
    await expect(dlg.getByText(/required/i).first()).toBeVisible();
    expect(calls).toBe(0);
  });

  test("KT-02 create a kit from the UI", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreate(page);
    await fillField(dlg, "Kit name", "Starter Pack");
    await fillField(dlg, "SKU", "KIT-STARTER");
    await fillField(dlg, "Price", "300");
    await dlg.getByRole("combobox").filter({ hasText: "Search for an item..." }).click();
    await page.getByRole("option", { name: "Office Chair - Default" }).first().click();
    await dlg.getByRole("button", { name: "Create kit" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /Starter Pack/ })).toBeVisible();
  });

  test("KT-03 duplicate kit SKU is refused with a clear message", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreate(page);
    await fillField(dlg, "Kit name", "Another Pack");
    await fillField(dlg, "SKU", "KIT-STARTER");
    await fillField(dlg, "Price", "100");
    await dlg.getByRole("combobox").filter({ hasText: "Search for an item..." }).click();
    await page.getByRole("option", { name: "Office Chair - Default" }).first().click();
    await dlg.getByRole("button", { name: "Create kit" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/already exists/i).first()).toBeVisible();
  });
});

test.describe.serial("Phase 9: POS", () => {
  // Item tiles are buttons named "Add <item name>, <price>".
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const addToCart = (page, name) =>
    page.getByRole("button", { name: new RegExp(`^Add ${escapeRe(name)},`) }).first().click();

  test("POS-01 cannot exceed available stock in the cart", async ({ page }) => {
    await signIn(page);
    // Laptop has only a few units after the stock phases
    const available = await db.variantQty("Laptop");
    await addToCart(page, "Laptop - Default");
    const plus = page.getByRole("button", { name: "One more Laptop - Default" });
    for (let i = 1; i < available; i++) await plus.click();
    await expect(plus).toBeDisabled();
    await addToCart(page, "Laptop - Default"); // tapping the tile again is refused too
    await expect(page.getByText(/Only \d+ of Laptop - Default in stock/).first()).toBeVisible();
  });

  test("POS-02 charge needs an invoice number, and cash must cover the total", async ({ page }) => {
    await signIn(page);
    await ensureShiftOpen(page);
    await addToCart(page, "T-Shirt - Default");
    const charge = page.getByRole("button", { name: /^Charge/ });
    await expect(charge).toBeDisabled();
    await expect(page.getByText("Enter the invoice no. to charge")).toBeVisible();
    await page.getByPlaceholder("e.g. 20481").fill("INV-POS-2");
    await page.getByLabel("Cash received").fill("50"); // less than the total
    await expect(charge).toBeDisabled();
    await expect(page.getByText("Cash received is less than the total")).toBeVisible();
    await page.getByRole("button", { name: "Exact" }).click();
    await expect(charge).toBeEnabled();
  });

  test("POS-03 sell a kit and a loose item together; stock drops for both", async ({ page }) => {
    const chairBefore = await db.variantQty("Office Chair");
    const shirtBefore = await db.variantQty("T-Shirt");
    await signIn(page);
    await addToCart(page, "Starter Pack");
    await addToCart(page, "T-Shirt - Default");
    await page.getByPlaceholder("e.g. 20481").fill("INV-POS-3");
    await page.getByLabel("Cash received").fill("1000");
    await page.getByLabel("Cash received").press("Enter"); // Enter charges
    await expect(page.getByText("Sale recorded")).toBeVisible();
    expect(await db.variantQty("Office Chair")).toBe(chairBefore - 1);
    expect(await db.variantQty("T-Shirt")).toBe(shirtBefore - 1);
  });

  test("POS-04 internal deduction removes stock without a sale", async ({ page }) => {
    const before = await db.variantQty("T-Shirt");
    await signIn(page);
    await addToCart(page, "T-Shirt - Default");
    await page.getByRole("radio", { name: "Internal deduction" }).click();
    await page.getByRole("button", { name: "Deduct 1 item" }).click();
    await page.getByRole("alertdialog", { name: "Confirm deduction" }).getByRole("button", { name: "Deduct", exact: true }).click();
    await expect(page.getByText(/deduction/i).first()).toBeVisible();
    expect(await db.variantQty("T-Shirt")).toBe(before - 1);
  });

  test("POS-05 sell one T-Shirt (voided later)", async ({ page }) => {
    await signIn(page);
    await ensureShiftOpen(page);
    await addToCart(page, "T-Shirt - Default");
    await page.getByPlaceholder("e.g. 20481").fill("INV-POS-5");
    await page.getByRole("button", { name: "Exact" }).click();
    await page.getByRole("button", { name: /^Charge/ }).click();
    await expect(page.getByText("Sale recorded")).toBeVisible();
  });
});

test.describe.serial("Phase 10: Orders", () => {
  test("OR-01 kit order shows its components in the details", async ({ page }) => {
    await signIn(page);
    await page.goto("/transactions");
    await rowAction(page, /INV-POS-3|INV INV-POS-3/, "View Details");
    const dlg = page.getByRole("alertdialog").last();
    await expect(dlg.getByText("Starter Pack").first()).toBeVisible();
    // Components are listed under the kit line (a "Default" variant name is not shown)
    await expect(dlg.getByRole("listitem").filter({ hasText: "Starter Pack" }).getByRole("listitem").filter({ hasText: /1 × Office Chair/ })).toBeVisible();
    await expect(dlg.getByText("INV-POS-3").first()).toBeVisible();
  });

  test("OR-02 refund a kit order; stock returns exactly", async ({ page }) => {
    const chairBefore = await db.variantQty("Office Chair");
    await signIn(page);
    await page.goto("/transactions");
    await rowAction(page, /INV-POS-3/, "Refund Order");
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Product Defect" }).click();
    await page.getByRole("button", { name: /^Refund PHP / }).click();
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
    await expect(receipt.getByText("Receipt No.:").first()).toBeVisible();
    await expect(receipt.getByText("Cashier:").first()).toBeVisible();
  });

  test("OR-05 partial refund: return only the loose T-Shirt from the kit order", async ({ page }) => {
    // OR-03 voided the full refund, so INV-POS-3 is a completed sale again
    const shirtBefore = await db.variantQty("T-Shirt");
    const chairBefore = await db.variantQty("Office Chair");
    await signIn(page);
    await page.goto("/transactions");
    await rowAction(page, /INV-POS-3/, "Refund Order");
    const dlg = page.getByRole("alertdialog").filter({ hasText: "Items to return" });
    await dlg.getByRole("group", { name: /Starter Pack/ }).getByRole("button", { name: "One less" }).click();
    await dlg.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Product Defect" }).click();
    await dlg.getByRole("button", { name: /^Refund PHP / }).click();
    await confirmDialog(page, "Yes, Refund");
    await expect(page.getByText(/Refunded 1 item/).first()).toBeVisible();
    expect(await db.variantQty("T-Shirt")).toBe(shirtBefore + 1);
    expect(await db.variantQty("Office Chair")).toBe(chairBefore);
    await expect(page.getByRole("row", { name: /INV-POS-3/ }).getByText("Partly refunded")).toBeVisible();
  });

  test("OR-06 void a sale: stock goes back and the order shows Voided", async ({ page }) => {
    const before = await db.variantQty("T-Shirt");
    await signIn(page);
    await page.goto("/transactions");
    await rowAction(page, /INV-POS-5/, "Void Sale");
    const dlg = page.getByRole("alertdialog").filter({ hasText: "Void Order" });
    await dlg.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "Rang up the wrong item" }).click();
    await dlg.getByRole("button", { name: "Void sale" }).click();
    await expect(page.getByText(/voided/i).first()).toBeVisible();
    expect(await db.variantQty("T-Shirt")).toBe(before + 1);
    await expect(page.getByRole("row", { name: /INV-POS-5/ }).getByText("Voided")).toBeVisible();
  });
});

test.describe.serial("Phase 10b: Shift close and sales reports", () => {
  test("SH-01 X reading, then close the shift with a cash count (Z reading)", async ({ page }) => {
    await signIn(page);
    await ensureShiftOpen(page);
    await page.getByRole("button", { name: "X reading" }).click();
    await expect(page.getByText("X reading · shift open")).toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();

    await page.getByRole("button", { name: "Close shift" }).click();
    const dlg = page.getByRole("alertdialog").filter({ hasText: "Cash counted" });
    await dlg.getByLabel("Cash counted").fill("1000");
    await dlg.getByRole("button", { name: "Close shift" }).click();
    await expect(page.getByText("Z reading · shift closed")).toBeVisible();
    await expect(page.getByText(/Short by|Over by|Drawer balances/).first()).toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText("Open a shift to start selling")).toBeVisible();
  });

  test("SH-02 reports: Sales and Shifts tabs", async ({ page }) => {
    await signIn(page);
    await page.goto("/reports");
    await page.getByRole("tab", { name: "Sales" }).click();
    await expect(page.getByText("Net sales").first()).toBeVisible();
    await expect(page.getByText("By payment method")).toBeVisible();
    await page.getByRole("tab", { name: "Shifts" }).click();
    await page.getByRole("button", { name: "Z reading" }).first().click();
    await expect(page.getByText("Z reading · shift closed")).toBeVisible();
  });
});
