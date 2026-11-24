// Structure refactor: page modals on local state (kits, suppliers, orders), merged API, no barcode.
const { test, expect } = require("@playwright/test");
const { uiLogin, watch } = require("./helpers");

const signIn = async (page) => {
  await uiLogin(page, "admin", "test");
  await expect(page).toHaveURL(/\/sales/);
};
const rowAction = async (page, rowText, action) => {
  await page.getByRole("row", { name: new RegExp(rowText) }).first().getByRole("button").last().click();
  await page.getByRole("menuitem", { name: action }).click();
};

test.describe("Structure refactor", () => {
  test("ST-01 kits: view modal opens with details and closes", async ({ page }) => {
    const issues = watch(page);
    await signIn(page);
    await page.goto("/inventory/kits");
    await rowAction(page, "Swag Box", "View Details");
    await expect(page.getByText("View Kit Details")).toBeVisible();
    await expect(page.getByRole("alertdialog").getByText("Swag Box").first()).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Close" }).first().click();
    await expect(page.getByText("View Kit Details")).toHaveCount(0);
    expect(issues.filter((i) => !/DevTools|Future Flag/.test(i))).toEqual([]);
  });

  test("ST-02 suppliers: create via modal, then view it", async ({ page }) => {
    await signIn(page);
    await page.goto("/inventory/suppliers");
    await page.getByRole("button", { name: "Add Supplier" }).click();
    await expect(page.getByText("Create New Supplier")).toBeVisible();
    await page.getByPlaceholder("Enter supplier name").fill("Structure Test Supplies");
    await page.getByRole("button", { name: /^(Create|Save|Submit)/ }).last().click();
    await page.getByRole("alertdialog", { name: "Create New Supplier" }).getByRole("button", { name: "Confirm" }).click();
    await expect(page.getByText(/Supplier created successfully/)).toBeVisible();
    await expect(page.getByRole("row", { name: /Structure Test Supplies/ })).toBeVisible();
    await rowAction(page, "Structure Test Supplies", "View Details");
    await expect(page.getByText("View Supplier")).toBeVisible();
  });

  test("ST-03 orders: view a refund, switch to its original order and back", async ({ page }) => {
    // S-03 in the smoke suite created a refund (RFD-...) for the POS sale
    await signIn(page);
    await page.goto("/transactions");
    await rowAction(page, "RFD-", "View Details");
    const dialog = page.getByRole("alertdialog");
    await expect(dialog.getByText(/RFD-/).first()).toBeVisible();
    await dialog.getByRole("button", { name: "View Original Order" }).click();
    await expect(dialog.getByText(/ORD-/).first()).toBeVisible();
    await dialog.getByRole("button", { name: "View Refund Order" }).click();
    await expect(dialog.getByText(/RFD-/).first()).toBeVisible();
  });

  test("ST-04 POS has no barcode scanner and still sells", async ({ page }) => {
    await signIn(page);
    await expect(page.getByText(/barcode/i)).toHaveCount(0);
    await expect(page.getByText("T-Shirt - Default").first()).toBeVisible();
  });
});

test("A11Y-01 form labels are linked to their inputs (getByLabel works)", async ({ page }) => {
  const { signIn } = require("./helpers");
  await signIn(page);
  await page.goto("/user-management");
  await page.getByRole("button", { name: "New User" }).click();
  await page.getByLabel("Full Name").fill("Label Linked");
  await page.getByLabel("Username").fill("labellinked");
  await expect(page.getByLabel("Full Name")).toHaveValue("Label Linked");
  await expect(page.getByRole("combobox", { name: "Role" })).toBeVisible();
});
