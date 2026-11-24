// Phases 6–7 — Stocks (admin) and stock approvals (supervisor -> admin)
const { test, expect } = require("@playwright/test");
const { signIn, fillField, fillNumber, chooseOption, rowAction, confirmDialog, apiToken, api } = require("./helpers");
const { db } = require("./db");

const openCreateStock = async (page) => {
  await page.goto("/inventory/stocks");
  await page.getByRole("button", { name: "Create New Stock" }).click();
  return page.getByRole("alertdialog").filter({ hasText: "Record a batch received from a supplier" });
};

test.describe.serial("Phase 6: Stocks", () => {
  // Earlier phases leave a pending supervisor request; the form (correctly) blocks stock-in for
  // variants with a pending request, so start from a clean slate.
  test.beforeAll(async ({ request }) => {
    const admin = await apiToken(request, "admin", "test");
    const pending = (await api(request, admin, "GET", "/approvals?admin_side=true&status=pending&pageSize=100")).body.data;
    for (const a of pending) await api(request, admin, "PATCH", `/approvals/${a.id}/reject`, { rejection_reason: "e2e cleanup" });
  });

  test("ST6-01 stock-in requires a variant, quantity and supplier", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreateStock(page);
    let calls = 0;
    page.on("request", (r) => { if (r.method() === "POST" && /\/v1\/stocks$/.test(r.url())) calls++; });
    await dlg.getByRole("button", { name: "Add Stock" }).click();
    await expect(dlg.getByText(/Select from the existing items|required|greater than 0/i).first()).toBeVisible();
    expect(calls).toBe(0);
  });

  test("ST6-02 admin stock-in adds a batch and raises the item total", async ({ page }) => {
    const before = await db.variantQty("Laptop");
    await signIn(page);
    const dlg = await openCreateStock(page);
    await chooseOption(page, dlg, "Item", "Laptop - Default");
    await fillField(dlg, "Quantity", "5");
    await chooseOption(page, dlg, "Supplier", "Acme Trading");
    await fillField(dlg, "Invoice no. (optional)", "DR-1001");
    await dlg.getByRole("button", { name: "Add Stock" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/Added 5 items/i).first()).toBeVisible();
    expect(await db.variantQty("Laptop")).toBe(before + 5);
    await expect(page.getByRole("row", { name: /DR-1001/ }).first()).toBeVisible();
  });

  test("ST6-03 a second batch on the same supplier invoice is allowed (grouping)", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreateStock(page);
    await chooseOption(page, dlg, "Item", "Office Chair - Default");
    await fillField(dlg, "Quantity", "2");
    await chooseOption(page, dlg, "Supplier", "Acme Trading");
    await fillField(dlg, "Invoice no. (optional)", "DR-1001");
    await dlg.getByRole("button", { name: "Add Stock" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/Added 2 items/i).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /DR-1001/ })).toHaveCount(2);
  });

  test("ST6-04 adjust a batch's quantity (sets on-hand; totals follow)", async ({ page }) => {
    const before = await db.variantQty("Laptop");
    await signIn(page);
    await page.goto("/inventory/stocks");
    await rowAction(page, /Laptop.*DR-1001|DR-1001.*Laptop/, "Adjust Stock");
    const dlg = page.getByRole("alertdialog").last();
    await fillField(dlg, "Quantity on hand", "3"); // 5 -> 3
    await chooseOption(page, dlg, "Reason", "Lost or Missing Stocks"); // lowering shows removal reasons
    await dlg.getByRole("button", { name: "Save adjustment" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/Adjusted stock quantity to 3/i).first()).toBeVisible();
    expect(await db.variantQty("Laptop")).toBe(before - 2);
  });

  test("ST6-05 an expired batch can be flushed; totals drop", async ({ page }) => {
    // Make the T-Shirt item track expiry and expire its seed batch
    await db.expireFirstBatch("T-Shirt");
    const before = await db.variantQty("T-Shirt");
    await signIn(page);
    await page.goto("/inventory/stocks");
    await rowAction(page, /T-Shirt/, "Flush & Delete");
    await confirmDialog(page);
    await expect(page.getByText(/Archived 1 expired stock batch/i).first()).toBeVisible();
    expect(await db.variantQty("T-Shirt")).toBeLessThan(before);
    await db.restoreTshirt(); // re-stock for later phases
  });
});

test.describe.serial("Phase 7: Stock approvals", () => {
  test("AP-01 supervisor stock-in becomes a pending request; admin approves; stock applied", async ({ page, browser }) => {
    const before = await db.variantQty("Office Chair");
    await signIn(page, "sup_ui", "suppass1");
    const dlg = await openCreateStock(page);
    await chooseOption(page, dlg, "Item", "Office Chair - Default");
    await fillField(dlg, "Quantity", "4");
    await chooseOption(page, dlg, "Supplier", "Acme Trading");
    await dlg.getByRole("button", { name: "Request stock" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/submitted for admin approval/i).first()).toBeVisible();
    expect(await db.variantQty("Office Chair"), "nothing changes before approval").toBe(before);

    const admin = await browser.newPage();
    await signIn(admin);
    await admin.goto("/inventory/approvals");
    await rowAction(admin, /Office Chair.*Pending|Pending.*Office Chair/, "Approve");
    await confirmDialog(admin);
    await expect(admin.getByText(/approved successfully/i).first()).toBeVisible();
    expect(await db.variantQty("Office Chair")).toBe(before + 4);
    await admin.close();
  });

  test("AP-02 rejecting needs a reason; rejected request changes nothing", async ({ page, request }) => {
    const sup = await apiToken(request, "sup_ui", "suppass1");
    const variants = (await api(request, sup, "GET", "/inventory/as-options")).body;
    const laptop = variants.find((v) => v.name === "Laptop - Default");
    const supplier = (await api(request, sup, "GET", "/supplier?pageSize=10")).body.data.find((s) => s.name === "Acme Trading");
    const r = await api(request, sup, "POST", "/stocks", { variant_id: laptop.id, quantity: 9, supplier_id: supplier.id, remarks: "reject me" });
    expect(r.body.requiresApproval).toBe(true);
    const before = await db.variantQty("Laptop");

    await signIn(page);
    await page.goto("/inventory/approvals");
    await rowAction(page, /Laptop.*Pending|Pending.*Laptop/, "Reject");
    const dlg = page.getByRole("alertdialog").last();
    await dlg.getByRole("button", { name: "Reject Approval" }).click();
    await expect(dlg.getByText(/required/i).first()).toBeVisible();
    await dlg.getByPlaceholder("Please provide a detailed reason for rejection...").fill("Wrong supplier");
    await dlg.getByRole("button", { name: "Reject Approval" }).click();
    await confirmDialog(page, "Yes, Reject");
    await expect(page.getByText(/rejected successfully/i).first()).toBeVisible();
    expect(await db.variantQty("Laptop")).toBe(before);
  });

  test("AP-03 supervisor sees only their own requests in 'View Stock Requests'", async ({ page }) => {
    await signIn(page, "sup_ui", "suppass1");
    await page.goto("/inventory/stocks");
    await page.getByRole("button", { name: "View Stock Requests" }).click();
    const dlg = page.getByRole("alertdialog").last();
    await expect(dlg.getByText(/Office Chair/).first()).toBeVisible();
  });
});
