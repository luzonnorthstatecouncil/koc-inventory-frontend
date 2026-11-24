// Phase 3 — Role access in the UI (API-level 403s are covered by the backend API suite)
const { test, expect } = require("@playwright/test");
const { signIn, apiToken, api } = require("./helpers");

// Sidebar link names
const NAV = ["Sales", "Transactions", "Items", "Kits", "Stocks", "Movements", "Suppliers", "Approvals", "Users", "Reports", "Audit log"];
const ACCESS = {
  user: ["Sales", "Transactions", "Items", "Kits", "Stocks", "Movements"],
  supervisor: ["Sales", "Transactions", "Items", "Kits", "Stocks", "Movements", "Suppliers", "Reports"],
};
// Blocked pages, by route, with the sidebar link that would lead there
const BLOCKED = { "/user-management": "Users", "/audit-logs": "Audit log", "/inventory/approvals": "Approvals", "/reports": "Reports", "/inventory/suppliers": "Suppliers" };

test.beforeAll(async ({ request }) => {
  // Known passwords for a supervisor and a staff account
  const admin = await apiToken(request, "admin", "test");
  const users = (await api(request, admin, "GET", "/users?pageSize=100")).body.data;
  const sup = users.find((u) => u.username === "sup_ui");
  await api(request, admin, "POST", `/users/${sup.id}/reset-password`, { new_password: "suppass1" });
  await api(request, admin, "POST", "/users", { full_name: "Rita Role", username: "staff_role", email: "staff_role@example.com", role: "user", userPassword: "staffpass1" });
});

const sidebarHas = async (page, label) =>
  page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label, exact: true }).count();

for (const [role, user, pass] of [["user", "staff_role", "staffpass1"], ["supervisor", "sup_ui", "suppass1"]]) {
  test(`R-${role} sidebar shows exactly the allowed modules`, async ({ page }) => {
    await signIn(page, user, pass);
    await page.getByRole("button", { name: "Sign out" }).waitFor(); // sidebar shows a skeleton until the profile loads
    for (const label of NAV) {
      const visible = (await sidebarHas(page, label)) > 0;
      expect(visible, `${role}: "${label}" in sidebar`).toBe(ACCESS[role].includes(label));
    }
  });

  test(`R-${role} blocked pages show a permission message`, async ({ page }) => {
    await signIn(page, user, pass);
    for (const [path, label] of Object.entries(BLOCKED)) {
      if (ACCESS[role].includes(label)) continue;
      await page.goto(path);
      await expect(page.getByText("You do not have permission to view this page."), path).toBeVisible();
    }
  });
}

test("R-staff stock and item management buttons are hidden", async ({ page }) => {
  await signIn(page, "staff_role", "staffpass1");
  await page.goto("/inventory/stocks");
  await expect(page.getByText("Inventory Stocks").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Create New Stock" })).toHaveCount(0);
  await page.goto("/inventory/items");
  await expect(page.getByRole("button", { name: "Add Product" })).toHaveCount(0);
});

test("R-supervisor stock-in becomes an approval request (UI message)", async ({ page, request }) => {
  await signIn(page, "sup_ui", "suppass1");
  await page.goto("/inventory/stocks");
  await expect(page.getByRole("button", { name: "Create New Stock" })).toBeVisible();
  // Submit through the API with the supervisor's own session cookie-less token (UI form covered in Phase 6)
  const token = await apiToken(request, "sup_ui", "suppass1");
  const variants = (await api(request, token, "GET", "/inventory/as-options")).body;
  const supplier = (await api(request, token, "GET", "/supplier?pageSize=5")).body.data[0];
  const r = await api(request, token, "POST", "/stocks", { variant_id: variants[0].id, quantity: 3, supplier_id: supplier.id });
  expect(r.status).toBe(201);
  expect(r.body.requiresApproval).toBe(true);
});

test("R-deduction toggle: hidden for staff, marked as needing approval for supervisors", async ({ page, browser }) => {
  await signIn(page, "staff_role", "staffpass1");
  await expect(page.getByRole("heading", { name: "Sales", level: 1 })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Internal deduction" })).toHaveCount(0);

  const sup = await browser.newPage();
  await signIn(sup, "sup_ui", "suppass1");
  await sup.getByRole("radio", { name: "Internal deduction" }).click();
  await expect(sup.getByText(/A State Officer approves it/)).toBeVisible();
  await sup.close();
});
