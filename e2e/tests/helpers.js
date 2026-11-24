const { expect } = require("@playwright/test");
const API = "http://localhost:5055/api/v1";

/** Log in through the real UI. */
async function uiLogin(page, username, password) {
  await page.goto("/login");
  await page.getByPlaceholder("Username").fill(username);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

/** Get a token straight from the API (for setup and API-level checks). */
async function apiToken(request, username, password) {
  const res = await request.post(`${API}/auth/login`, { data: { username, password } });
  expect(res.ok(), `login ${username}`).toBeTruthy();
  return (await res.json()).token;
}

async function api(request, token, method, path, data) {
  const res = await request.fetch(`${API}${path}`, {
    method,
    data,
    headers: { Authorization: `Bearer ${token}` },
  });
  let body = null;
  try { body = await res.json(); } catch {}
  return { status: res.status(), body };
}

/** Collect browser console errors and failed API calls for the bug log. */
function watch(page) {
  const issues = [];
  page.on("console", (m) => { if (m.type() === "error") issues.push(`console: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => issues.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on("response", (r) => { if (r.url().includes("/api/") && r.status() >= 500) issues.push(`HTTP ${r.status()} ${r.request().method()} ${r.url()}`); });
  return issues;
}

module.exports = { API, uiLogin, apiToken, api, watch };

// ---- UI helpers for the phase specs ----
/** The wrapper div of a labelled field (labels aren't linked to inputs, so find by wrapper). */
function field(scope, label) {
  return scope.locator(`div:has(> label:text-is("${label}"))`).last();
}
async function fillField(scope, label, value) {
  const input = field(scope, label).locator("input, textarea").first();
  await input.fill(String(value));
}
async function chooseOption(page, scope, label, optionText) {
  await field(scope, label).getByRole("combobox").first().click();
  await page.getByRole("option", { name: optionText, exact: true }).first().click();
}
async function signIn(page, username = "admin", password = "test") {
  await uiLogin(page, username, password);
  await expect(page).toHaveURL(/\/sales/);
}
async function rowAction(page, rowText, action) {
  await page.getByRole("row", { name: rowText instanceof RegExp ? rowText : new RegExp(rowText) }).first().getByRole("button").last().click();
  await page.getByRole("menuitem", { name: action }).click();
}
/** Click the confirm button of the app's confirmation dialog (if one appears). */
async function confirmDialog(page, name) {
  const dlg = page.getByRole("alertdialog").filter({ has: page.getByRole("button", { name: /cancel/i }) }).last();
  // A named button is unique enough to find page-wide (stacked dialogs can share a Cancel button)
  const btn = name ? page.getByRole("button", { name }) : dlg.getByRole("button").filter({ hasNotText: /^cancel$/i });
  await btn.last().click();
}
module.exports.field = field;
module.exports.fillField = fillField;
module.exports.chooseOption = chooseOption;
module.exports.signIn = signIn;
module.exports.rowAction = rowAction;
module.exports.confirmDialog = confirmDialog;
/** Number steppers (InputNumber) use a paragraph as their label, followed by -/input/+ controls. */
async function fillNumber(scope, label, value) {
  const input = scope.locator(`xpath=.//p[normalize-space()="${label}"]/following::input[1]`).first();
  await input.fill(String(value));
}
module.exports.fillNumber = fillNumber;
/** The POS till is closed until a shift is open; open one (with a float) if it isn't. */
async function ensureShiftOpen(page, openingCash = 1000) {
  const open = page.getByText("Open a shift to start selling");
  // The shift strip above the till: "Shift open" / "Since 9:00 AM"
  const bar = page.getByRole("region", { name: "Current shift" });
  await expect(open.or(bar).first()).toBeVisible();
  if (await open.isVisible()) {
    await page.getByLabel("Opening cash in drawer").fill(String(openingCash));
    await page.getByRole("button", { name: /^Open shift with/ }).click();
    await expect(bar).toBeVisible();
  }
}
module.exports.ensureShiftOpen = ensureShiftOpen;
