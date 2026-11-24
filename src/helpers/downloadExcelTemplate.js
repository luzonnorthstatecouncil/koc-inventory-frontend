/**
 * Bulk-import templates with dropdowns and value rules on the cells, built from live data so
 * staff can only pick real categories, units, items and suppliers. Loaded only on download.
 */
import { UNIT_OPTIONS } from "@/constants/options";
import { stockItemLabel } from "@/helpers/bulkImport";

const ROWS = 1000; // rows prepared with dropdowns / rules (matches the import limit)
const NAVY = "FF112866";

const todayDate = () => {
   const d = new Date();
   return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

async function newWorkbook() {
   const { default: ExcelJS } = await import("exceljs");
   const workbook = new ExcelJS.Workbook();
   workbook.creator = "KofC Inventory";
   workbook.created = new Date();
   return workbook;
}

/** Header row: bold white on navy, frozen, with a note on each header cell. */
function addDataSheet(workbook, name, columns) {
   const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
   sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width ?? 16, style: c.style }));
   const header = sheet.getRow(1);
   header.font = { bold: true, color: { argb: "FFFFFFFF" } };
   header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NAVY } };
   header.alignment = { vertical: "middle" };
   header.height = 22;
   columns.forEach((c, i) => {
      if (c.note) header.getCell(i + 1).note = c.note;
   });
   return sheet;
}

/** A reference sheet (lists the dropdowns point at); plain, read-only in spirit. */
function addListSheet(workbook, name, headers, rows, widths = []) {
   const sheet = workbook.addWorksheet(name);
   sheet.addRow(headers).font = { bold: true };
   rows.forEach((r) => sheet.addRow(r));
   headers.forEach((_, i) => {
      sheet.getColumn(i + 1).width = widths[i] ?? 24;
   });
   return sheet;
}

const listRule = (formula, title, message) => ({
   type: "list",
   allowBlank: true,
   formulae: [formula],
   showErrorMessage: true,
   errorStyle: "stop",
   errorTitle: title,
   error: message,
});

const wholeRule = (min, title, message, max) => ({
   type: "whole",
   operator: max != null ? "between" : "greaterThanOrEqual",
   allowBlank: true,
   formulae: max != null ? [min, max] : [min],
   showErrorMessage: true,
   errorStyle: "stop",
   errorTitle: title,
   error: message,
});

const dateRule = (operator, date, title, message) => ({
   type: "date",
   operator,
   allowBlank: true,
   formulae: [date],
   showErrorMessage: true,
   errorStyle: "stop",
   errorTitle: title,
   error: message,
});

/** Applies a rule to a whole column's data rows (row 2 to ROWS + 1). */
function ruleForColumn(sheet, colLetter, rule) {
   sheet.dataValidations.add(`${colLetter}2:${colLetter}${ROWS + 1}`, rule);
}

function addInstructions(workbook, lines) {
   const sheet = workbook.addWorksheet("Instructions");
   sheet.getColumn(1).width = 110;
   lines.forEach((line, i) => {
      const row = sheet.addRow([line]);
      if (i === 0) row.font = { bold: true, size: 13 };
   });
}

async function save(workbook, filename) {
   const buffer = await workbook.xlsx.writeBuffer();
   const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url;
   a.download = filename;
   document.body.appendChild(a);
   a.click();
   a.remove();
   setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Items template. `categories`: [{ id, name }] from the API. */
export async function downloadBulkImportTemplate({ categories = [] } = {}, filename = "item_import_template.xlsx") {
   const workbook = await newWorkbook();
   const dateStyle = { numFmt: "yyyy-mm-dd" };

   const sheet = addDataSheet(workbook, "Items", [
      { header: "Item Name", key: "item_name", width: 28, note: "Required. Rows with the same Item Name become variants of one item." },
      { header: "Category", key: "category", width: 22, note: "Required. Pick from the list." },
      { header: "Unit", key: "unit", width: 10, note: "Required. Pick from the list." },
      { header: "Price", key: "price", width: 12, note: "Required. More than 0, e.g. 250 or 99.50.", style: { numFmt: "#,##0.00" } },
      { header: "Status", key: "status", width: 11, note: "active or inactive (defaults to active)." },
      { header: "Variant Name", key: "variant_name", width: 18, note: "e.g. Small, Red. Leave blank for Default." },
      { header: "Reorder Level", key: "reorder_level", width: 14, note: "Whole number. Defaults to 5." },
      { header: "Safe Qty Level", key: "safe_qty_level", width: 15, note: "Whole number, at least the Reorder Level. Defaults to 10." },
      { header: "Max Qty Level", key: "max_qty_level", width: 15, note: "Whole number, at least the Safe Qty Level. Defaults to 20." },
      { header: "Stocks", key: "stocks", width: 10, note: "Optional starting quantity, up to the Max Qty Level." },
      { header: "Expiration Date", key: "expiration_date", width: 16, note: "Only for items that expire. After today.", style: dateStyle },
      { header: "Date Received", key: "date_received", width: 15, note: "When the starting stock arrived. Today or earlier.", style: dateStyle },
   ]);

   const categoryNames = [...new Set(categories.map((c) => String(c.name).trim()).filter(Boolean))];
   addListSheet(workbook, "Categories", ["Category"], categoryNames.map((n) => [n]), [30]);
   addListSheet(workbook, "Units", ["Unit", "Meaning"], UNIT_OPTIONS.map((u) => [u.value, u.label]), [10, 18]);

   const catEnd = Math.max(categoryNames.length + 1, 2);
   const unitEnd = UNIT_OPTIONS.length + 1;
   ruleForColumn(sheet, "B", listRule(`Categories!$A$2:$A$${catEnd}`, "Unknown category", "Pick a category from the list."));
   ruleForColumn(sheet, "C", listRule(`Units!$A$2:$A$${unitEnd}`, "Unknown unit", "Pick a unit from the list."));
   ruleForColumn(sheet, "D", {
      type: "decimal",
      operator: "greaterThan",
      allowBlank: true,
      formulae: [0],
      showErrorMessage: true,
      errorStyle: "stop",
      errorTitle: "Invalid price",
      error: "Price must be a number more than 0.",
   });
   ruleForColumn(sheet, "E", listRule('"active,inactive"', "Invalid status", "Pick active or inactive."));
   ruleForColumn(sheet, "G", wholeRule(0, "Invalid level", "Use a whole number of 0 or more."));
   ruleForColumn(sheet, "H", wholeRule(0, "Invalid level", "Use a whole number of 0 or more."));
   ruleForColumn(sheet, "I", wholeRule(1, "Invalid level", "Use a whole number of 1 or more."));
   ruleForColumn(sheet, "J", wholeRule(0, "Invalid stocks", "Use a whole number of 0 or more."));
   ruleForColumn(sheet, "K", dateRule("greaterThan", todayDate(), "Invalid date", "Expiration Date must be after today."));
   ruleForColumn(sheet, "L", dateRule("lessThanOrEqual", todayDate(), "Invalid date", "Date Received can't be in the future."));

   addInstructions(workbook, [
      "How to fill in the Items sheet",
      "",
      "• One row per item variant. For an item with sizes or colours, add a row for each with the same Item Name.",
      "• Rows with the same Item Name must have the same Category, Unit and Price.",
      "• Category, Unit and Status are dropdowns: pick a value instead of typing it.",
      "• Levels: Reorder Level ≤ Safe Qty Level ≤ Max Qty Level. Blank levels default to 5, 10 and 20.",
      "• Stocks is optional. Leave it blank to create the item with no stock.",
      "• Fill Expiration Date only for items that expire. If any row of an item has one, every row with Stocks needs one.",
      "• Dates use YYYY-MM-DD, e.g. 2026-12-31.",
      "• Up to 1,000 rows per file. Everything is checked when you upload, before anything is saved.",
   ]);

   workbook.views = [{ activeTab: 0 }];
   await save(workbook, filename);
}

/**
 * Stocks template. `options`: item variants (with sku, inventory_name, variant_name, current_qty,
 * max_qty_level, has_expiry); `suppliers`: [{ id, name, status }].
 */
export async function downloadBulkStockImportTemplate(
   { options = [], suppliers = [] } = {},
   filename = "stock_import_template.xlsx",
) {
   const workbook = await newWorkbook();
   const dateStyle = { numFmt: "yyyy-mm-dd" };

   const sheet = addDataSheet(workbook, "Stocks", [
      { header: "Item", key: "item", width: 46, note: "Required. Pick the item and variant from the list." },
      { header: "Supplier", key: "supplier", width: 28, note: "Required. Pick from the list." },
      { header: "Quantity", key: "quantity", width: 11, note: "Required. Whole number, within the room left (see the Item list sheet)." },
      { header: "Invoice No", key: "invoice_no", width: 16, note: "Optional. From the supplier's receipt." },
      { header: "Received Date", key: "received_at", width: 15, note: "Required. Today or earlier.", style: dateStyle },
      { header: "Expiration Date", key: "expires_at", width: 16, note: "Only for items that track expiry. After today.", style: dateStyle },
      { header: "Remarks", key: "remarks", width: 30, note: "Optional." },
   ]);

   const items = [...options].sort((a, b) => stockItemLabel(a).localeCompare(stockItemLabel(b)));
   addListSheet(
      workbook,
      "Item list",
      ["Item", "SKU", "In stock", "Max level", "Room left", "Tracks expiry"],
      items.map((o) => {
         const current = Number(o.current_qty || 0);
         const max = Number(o.max_qty_level || 0);
         return [stockItemLabel(o), o.sku, current, max, Math.max(max - current, 0), o.has_expiry ? "Yes" : "No"];
      }),
      [46, 18, 10, 11, 11, 13],
   );
   const activeSuppliers = suppliers.filter((s) => !s.status || s.status === "active");
   addListSheet(workbook, "Suppliers", ["Supplier"], activeSuppliers.map((s) => [s.name]), [32]);

   const itemEnd = Math.max(items.length + 1, 2);
   const supplierEnd = Math.max(activeSuppliers.length + 1, 2);
   ruleForColumn(sheet, "A", listRule(`'Item list'!$A$2:$A$${itemEnd}`, "Unknown item", "Pick an item from the list."));
   ruleForColumn(sheet, "B", listRule(`Suppliers!$A$2:$A$${supplierEnd}`, "Unknown supplier", "Pick a supplier from the list."));
   ruleForColumn(sheet, "C", wholeRule(1, "Invalid quantity", "Quantity must be a whole number of 1 or more."));
   ruleForColumn(sheet, "E", dateRule("lessThanOrEqual", todayDate(), "Invalid date", "Received Date can't be in the future."));
   ruleForColumn(sheet, "F", dateRule("greaterThan", todayDate(), "Invalid date", "Expiration Date must be after today."));

   addInstructions(workbook, [
      "How to fill in the Stocks sheet",
      "",
      "• One row per batch received.",
      "• Item and Supplier are dropdowns: pick a value instead of typing it.",
      "• Quantity can't go past the item's max level. The Item list sheet shows the room left for each item; rows for the same item add up.",
      "• Fill Expiration Date only for items that track expiry (see the Item list sheet), and leave it blank for the others.",
      "• Dates use YYYY-MM-DD, e.g. 2026-04-16.",
      "• Up to 1,000 rows per file. Everything is checked when you upload, before anything is saved.",
      "• Supervisors' imports are sent to an administrator for approval.",
   ]);

   workbook.views = [{ activeTab: 0 }];
   await save(workbook, filename);
}
