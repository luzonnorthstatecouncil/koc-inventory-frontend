// Phase 2 — User management (admin)
const { test, expect } = require("@playwright/test");
const { signIn, fillField, chooseOption, rowAction, confirmDialog, uiLogin, watch } = require("./helpers");

const openCreate = async (page) => {
  await page.goto("/user-management");
  await page.getByRole("button", { name: "New User" }).click();
  return page.getByRole("alertdialog").filter({ hasText: "Give someone access to the system." });
};

test.describe.serial("Phase 2: User management", () => {
  test("U-01 required fields are enforced before submit", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreate(page);
    let calls = 0;
    page.on("request", (r) => { if (r.method() === "POST" && r.url().includes("/v1/users")) calls++; });
    await dlg.getByRole("button", { name: /Create user|Submit|Save/ }).last().click();
    await expect(dlg.getByText(/required/i).first()).toBeVisible();
    expect(calls).toBe(0);
  });

  test("U-02 invalid email is rejected client-side", async ({ page }) => {
    await signIn(page);
    const dlg = await openCreate(page);
    await fillField(dlg, "Full name", "Bad Email");
    await fillField(dlg, "Username", "bademail");
    await fillField(dlg, "Email", "not-an-email");
    await chooseOption(page, dlg, "Role", "Staff");
    await dlg.getByRole("button", { name: /Create user|Submit|Save/ }).last().click();
    await expect(dlg.getByText(/valid email|invalid/i).first()).toBeVisible();
  });

  test("U-03 create a supervisor; email fails so the credentials are shown to the admin", async ({ page }) => {
    const issues = watch(page);
    await signIn(page);
    const dlg = await openCreate(page);
    await fillField(dlg, "Full name", "Sam Supervisor");
    await fillField(dlg, "Username", "sup_ui");
    await fillField(dlg, "Email", "sup_ui@example.com");
    await chooseOption(page, dlg, "Role", "Supervisor");
    await dlg.getByRole("button", { name: /Create user|Submit|Save/ }).last().click();
    await confirmDialog(page);
    await expect(page.getByText(/email could not be sent/i).first()).toBeVisible();
    // Credentials modal with a generated password
    await expect(page.getByText("sup_ui").last()).toBeVisible();
    expect(issues.filter((i) => /HTTP 5/.test(i))).toEqual([]);
  });

  test("U-04 create staff with a chosen password; duplicate username is refused", async ({ page }) => {
    await signIn(page);
    let dlg = await openCreate(page);
    await fillField(dlg, "Full name", "Stan Staff");
    await fillField(dlg, "Username", "staff_ui");
    await fillField(dlg, "Email", "staff_ui@example.com");
    await chooseOption(page, dlg, "Role", "Staff");
    await fillField(dlg, "Password (optional)", "staffpass1");
    await dlg.getByRole("button", { name: /Create user|Submit|Save/ }).last().click();
    await confirmDialog(page);
    await expect(page.getByText(/User created successfully/i).first()).toBeVisible();

    await page.keyboard.press("Escape");
    dlg = await openCreate(page);
    await fillField(dlg, "Full name", "Dupe Person");
    await fillField(dlg, "Username", "staff_ui");
    await fillField(dlg, "Email", "dupe@example.com");
    await chooseOption(page, dlg, "Role", "Staff");
    await dlg.getByRole("button", { name: /Create user|Submit|Save/ }).last().click();
    await confirmDialog(page);
    await expect(page.getByText(/already exists/i).first()).toBeVisible();
  });

  test("U-05 the new staff account can sign in with its password", async ({ page }) => {
    await signIn(page, "staff_ui", "staffpass1");
  });

  test("U-06 edit a user's name", async ({ page }) => {
    await signIn(page);
    await page.goto("/user-management");
    await rowAction(page, "Stan Staff", "Edit User");
    const dlg = page.getByRole("alertdialog").last();
    await fillField(dlg, "Full name", "Stan Staff Edited");
    await dlg.getByRole("button", { name: /Save|Update|Submit/ }).last().click();
    await confirmDialog(page);
    await expect(page.getByRole("row", { name: /Stan Staff Edited/ })).toBeVisible();
  });

  test("U-07 change a user's password manually; old one stops working", async ({ page, browser }) => {
    await signIn(page);
    await page.goto("/user-management");
    await rowAction(page, "Stan Staff Edited", "Change Password");
    const dlg = page.getByRole("alertdialog").last();
    await dlg.getByPlaceholder("New password", { exact: true }).fill("newstaff22");
    await dlg.getByPlaceholder("Confirm new password").fill("newstaff22");
    await dlg.getByRole("button", { name: /Change|Reset|Save|Submit/ }).last().click();
    await confirmDialog(page);
    await expect(page.getByText(/Password reset successfully/i).first()).toBeVisible();

    const other = await browser.newPage();
    await uiLogin(other, "staff_ui", "staffpass1");
    await expect(other.getByText("Invalid credentials").first()).toBeVisible();
    await other.close();
  });

  test("U-08 deactivate a user; they can no longer sign in", async ({ page, browser }) => {
    await signIn(page);
    await page.goto("/user-management");
    await rowAction(page, "Stan Staff Edited", "Edit User");
    const dlg = page.getByRole("alertdialog").last();
    await dlg.getByRole("checkbox").last().click(); // "Is this user active?"
    await dlg.getByRole("button", { name: /Save|Update|Submit/ }).last().click();
    await confirmDialog(page);
    await expect(page.getByText(/updated successfully/i).first()).toBeVisible();

    const other = await browser.newPage();
    await uiLogin(other, "staff_ui", "newstaff22");
    await expect(other.getByText(/disabled/i).first()).toBeVisible();
    await other.close();
  });

  test("U-09 an inactive user can be found with the Status filter (to reactivate or delete)", async ({ page }) => {
    await signIn(page);
    await page.goto("/user-management");
    const reqs = [];
    page.on("request", (r) => { if (r.url().includes("/v1/users?")) reqs.push(r.url()); });
    await page.getByRole("combobox").filter({ hasText: "Select Status" }).click();
    await page.getByRole("option", { name: "Inactive", exact: true }).click();
    await expect(page.getByRole("row", { name: /Stan Staff Edited/ }), "inactive user listed; requests: " + reqs.join(" | ")).toBeVisible();
  });

  test("U-10 delete a user; they disappear from the list", async ({ page }) => {
    await signIn(page);
    await page.goto("/user-management");
    await page.getByRole("combobox").filter({ hasText: "Select Status" }).click();
    await page.getByRole("option", { name: "Inactive", exact: true }).click();
    await rowAction(page, "Stan Staff Edited", "Delete User");
    await confirmDialog(page);
    await expect(page.getByText(/deleted successfully/i).first()).toBeVisible();
    await expect(page.getByRole("row", { name: /Stan Staff Edited/ })).toHaveCount(0);
  });
});
