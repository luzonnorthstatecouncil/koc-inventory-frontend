// Phase 1 — Authentication & session
const { test, expect } = require("@playwright/test");
const { uiLogin, apiToken, api, watch, API } = require("./helpers");

const ADMIN = { username: "admin", password: "test", email: "admin@example.com" };

test.describe("Phase 1: Auth & session", () => {
  test("P1-01 empty submit shows required errors and sends no request", async ({ page }) => {
    let loginCalls = 0;
    page.on("request", (r) => { if (r.url().includes("/auth/login")) loginCalls++; });
    await page.goto("/login");
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("This field is required")).toHaveCount(2);
    expect(loginCalls).toBe(0);
    await expect(page).toHaveURL(/\/login/);
  });

  test("P1-02 wrong password is rejected with a clear message", async ({ page }) => {
    await uiLogin(page, ADMIN.username, "wrong-password");
    await expect(page.getByText("Invalid credentials").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
  });

  test("P1-03 unknown user gets the same message (no user enumeration)", async ({ page }) => {
    await uiLogin(page, "nobody_here_123", "whatever");
    await expect(page.getByText("Invalid credentials").first()).toBeVisible();
  });

  test("P1-04 injection-style username is rejected safely", async ({ page }) => {
    await uiLogin(page, "' OR 1=1 --", "' OR 1=1 --");
    await expect(page.getByText("Invalid credentials").first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("P1-05 protected routes redirect to login without a token", async ({ page }) => {
    for (const path of ["/sales", "/inventory/items", "/user-management", "/reports"]) {
      await page.goto(path);
      await expect(page, `${path} should redirect`).toHaveURL(/\/login/);
    }
  });

  test("P1-06 login with username lands on Sales and stores token", async ({ page }) => {
    const issues = watch(page);
    await uiLogin(page, ADMIN.username, ADMIN.password);
    await expect(page).toHaveURL(/\/sales/);
    await expect(page.getByRole("heading", { name: "Sales", level: 1 })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBeTruthy();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    expect(issues, issues.join("\n")).toEqual([]);
  });

  test("P1-07 login with email also works", async ({ page }) => {
    await uiLogin(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/\/sales/);
  });

  test("P1-08 session survives reload; /login redirects when already signed in", async ({ page }) => {
    await uiLogin(page, ADMIN.username, ADMIN.password);
    await expect(page).toHaveURL(/\/sales/);
    await page.reload();
    await expect(page).toHaveURL(/\/sales/);
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await page.goto("/login");
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test("P1-09 sign out clears the session and blocks protected pages", async ({ page }) => {
    await uiLogin(page, ADMIN.username, ADMIN.password);
    await expect(page).toHaveURL(/\/sales/);
    await page.getByRole("button", { name: "Sign out" }).click(); // signs out directly (the shift stays open server-side)
    await expect(page).toHaveURL(/\/login/);
    expect(await page.evaluate(() => localStorage.getItem("token"))).toBeNull();
    await page.goto("/sales");
    await expect(page).toHaveURL(/\/login/);
  });

  test("P1-10 a tampered token is rejected and the user is sent to login", async ({ page }) => {
    await page.goto("/login");
    await page.evaluate(() => localStorage.setItem("token", "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.forged"));
    await page.goto("/sales");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("P1-11 [API] logout revokes the token", async ({ request }) => {
    const token = await apiToken(request, ADMIN.username, ADMIN.password);
    expect((await api(request, token, "GET", "/inventory")).status).toBe(200);
    expect((await api(request, token, "POST", "/auth/logout")).status).toBe(200);
    const after = await api(request, token, "GET", "/inventory");
    expect(after.status, "token should be unusable after logout").toBe(401);
  });

  test("P1-12 [API] logging in again invalidates the previous token", async ({ request }) => {
    const first = await apiToken(request, ADMIN.username, ADMIN.password);
    await new Promise((r) => setTimeout(r, 1100)); // distinct iat
    await apiToken(request, ADMIN.username, ADMIN.password);
    const check = await api(request, first, "GET", "/auth/check");
    const data = await api(request, first, "GET", "/inventory");
    expect({ check: check.status, data: data.status }, "old token after re-login").toEqual({ check: 401, data: 401 });
  });

  test("P1-13 [API] login with missing body fields fails cleanly (4xx, not 500)", async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, { data: {} });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });
});
