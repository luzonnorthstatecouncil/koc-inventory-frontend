// Phases 4–5 — Suppliers and inventory items
const { test, expect } = require("@playwright/test");
const { signIn, fillField, chooseOption, rowAction, confirmDialog, apiToken, api } = require("./helpers");

test.describe.serial("Phase 4: Suppliers", () => {
  test("SU-01 blank supplier name is blocked", async ({ page }) => {
    await signIn(page);
    await page.goto("/inventory/suppliers");
    await page.getByRole("button", { name: "Add Supplier" }).click();
    await page.getByRole("button", { name: "Create Supplier" }).click();
    await expect(page.getByPlaceholder("Enter supplier name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("This field is required").first()).toBeVisible();
  });

  test("SU-02 duplicate supplier name shows the server's message", async ({ page }) => {
    await signIn(page);
    await page.goto("/inventory/suppliers");
    await page.getByRole("button", { name: "Add Supplier" }).click();
    await page.getByPlaceholder("Enter supplier name").fill("Structure Test Supplies"); // created in Phase 3 structure test
    await page.getByRole("button", { name: "Create Supplier" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/already exists/i).first()).toBeVisible();
  });

  test("SU-03 edit a supplier's name", async ({ page }) => {
    await signIn(page);
    await page.goto("/inventory/suppliers");
    await rowAction(page, "Structure Test Supplies", "Edit Supplier");
    const dlg = page.getByRole("alertdialog").last();
    await dlg.getByPlaceholder("Enter supplier name").fill("Acme Trading");
    await dlg.getByRole("button", { name: /Save|Update/ }).last().click();
    await confirmDialog(page);
    await expect(page.getByRole("row", { name: /Acme Trading/ })).toBeVisible();
  });
});

test.describe.serial("Phase 5: Inventory items", () => {
  const openAdd = async (page) => {
    await page.goto("/inventory/items");
    await page.getByRole("button", { name: "Add Product" }).click();
    return page.getByRole("alertdialog").last();
  };

  test("IT-01 required item fields are enforced", async ({ page }) => {
    await signIn(page);
    const dlg = await openAdd(page);
    let calls = 0;
    page.on("request", (r) => { if (r.method() === "POST" && /\/v1\/inventory$/.test(r.url())) calls++; });
    await dlg.getByRole("button", { name: "Create Item" }).click();
    await expect(dlg.getByText(/required/i).first()).toBeVisible();
    expect(calls).toBe(0);
  });

  test("IT-02 create an item with two variants", async ({ page }) => {
    await signIn(page);
    const dlg = await openAdd(page);
    await fillField(dlg, "Product Name", "Polo Shirt");
    await chooseOption(page, dlg, "Category", "Apparel");
    await fillField(dlg, "Unit Price", "350");
    await chooseOption(page, dlg, "Unit", "Piece");
    await dlg.getByRole("tab", { name: "Variants" }).click();
    const variantInputs = dlg.getByPlaceholder("e.g., Small, Medium, Large, Red, Blue");
    await variantInputs.first().fill("Small");
    await dlg.getByRole("button", { name: "Add Variant" }).click(); // now a real button
    await variantInputs.nth(1).fill("Large");
    await dlg.getByRole("button", { name: "Create Item" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /Polo Shirt/ })).toBeVisible();
  });

  test("IT-03 duplicate name in the same category is refused", async ({ page }) => {
    await signIn(page);
    const dlg = await openAdd(page);
    await fillField(dlg, "Product Name", "Polo Shirt");
    await chooseOption(page, dlg, "Category", "Apparel");
    await fillField(dlg, "Unit Price", "350");
    await chooseOption(page, dlg, "Unit", "Piece");
    await dlg.getByRole("tab", { name: "Variants" }).click();
    await dlg.getByPlaceholder("e.g., Small, Medium, Large, Red, Blue").first().fill("One");
    await dlg.getByRole("button", { name: "Create Item" }).click();
    await confirmDialog(page);
    await expect(page.getByText(/already exists/i).first()).toBeVisible();
  });

  test("IT-04 editing an item keeps its stock and saves the change", async ({ page, request }) => {
    const token = await apiToken(request, "admin", "test");
    const before = (await api(request, token, "GET", "/inventory?search=T-Shirt")).body.data[0];
    await signIn(page);
    await page.goto("/inventory/items");
    await rowAction(page, "T-Shirt", "Edit Product");
    const dlg = page.getByRole("alertdialog").last();
    await fillField(dlg, "Unit Price", "275");
    await dlg.getByRole("button", { name: /Submit|Save|Update/ }).last().click();
    await confirmDialog(page);
    await expect(page.getByText(/updated successfully/i).first()).toBeVisible();
    // The UI sign-in ended the earlier API session (one session per account), so sign in again
    const token2 = await apiToken(request, "admin", "test");
    const after = (await api(request, token2, "GET", `/inventory/${before.id}`)).body;
    expect(Number(after.price)).toBe(275);
    expect(after.variants[0].current_qty).toBe(before.variants[0].current_qty);
  });

  test("IT-05 deleting an item that still has stock is refused with a reason", async ({ page }) => {
    await signIn(page);
    await page.goto("/inventory/items");
    await rowAction(page, "T-Shirt", "Delete Product");
    await confirmDialog(page);
    await expect(page.getByText(/Cannot delete/i).first()).toBeVisible();
  });

  test("IT-06 deleting an empty item works", async ({ page }) => {
    await signIn(page);
    await page.goto("/inventory/items");
    await rowAction(page, "Polo Shirt", "Delete Product");
    await confirmDialog(page);
    await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /Polo Shirt/ })).toHaveCount(0);
  });

  test("IT-07 item details and its Orders tab load (orders matched by item id)", async ({ page }) => {
    await signIn(page);
    await page.goto("/inventory/items");
    const ordersReq = page.waitForResponse((r) => /\/v1\/orders\/inventory\/\d+/.test(r.url()));
    await rowAction(page, "T-Shirt", "View Orders");
    const res = await ordersReq;
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.length, "T-Shirt has sales from the POS phase").toBeGreaterThan(0);
  });
});
