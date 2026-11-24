/**
 * Reading and checking bulk-import spreadsheets before anything is sent.
 * Every message names the spreadsheet column and every row keeps its spreadsheet row number,
 * so staff can find and fix the cell in Excel.
 */
import { UNIT_OPTIONS } from "@/constants/options";

export const MAX_IMPORT_ROWS = 1000;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

const pad = (n) => String(n).padStart(2, "0");
const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayYmd = () => toYmd(new Date());

const blank = (v) => v === undefined || v === null || String(v).trim() === "";
const text = (v) => (blank(v) ? "" : String(v).trim());

/**
 * A cell as YYYY-MM-DD. Handles real Excel dates, Excel serial numbers and typed text
 * (YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY). Returns "" when empty and null when it isn't a date.
 */
export function cellDate(value) {
   if (blank(value)) return "";
   if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : toYmd(value);
   if (typeof value === "number") {
      // Excel serial date (days since 1899-12-30)
      if (value < 1 || value > 2958465) return null;
      const ms = Math.round((value - 25569) * 86400 * 1000);
      const d = new Date(ms);
      return toYmd(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
   }
   const s = String(value).trim();
   let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
   if (m) return validYmd(+m[1], +m[2], +m[3]);
   m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
   if (m) return validYmd(+m[3], +m[1], +m[2]);
   return null;
}

function validYmd(y, mo, d) {
   const date = new Date(y, mo - 1, d);
   if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
   return toYmd(date);
}

/** A cell as a whole number; "" when empty, NaN when it isn't one. */
const cellInt = (value) => {
   if (blank(value)) return "";
   const n = Number(String(value).replace(/,/g, "").trim());
   return Number.isInteger(n) ? n : NaN;
};

/** A cell as an amount; "" when empty, NaN when it isn't one. */
const cellMoney = (value) => {
   if (blank(value)) return "";
   const n = Number(String(value).replace(/[₱,\s]|PHP/gi, ""));
   return Number.isFinite(n) ? n : NaN;
};

/** Case/space-insensitive header lookup, so "item name", "Item Name" and "item_name" all match. */
const norm = (h) => String(h).toLowerCase().replace(/[\s_]+/g, " ").trim();

function pick(row, column) {
   for (const key of [column.header, ...(column.aliases ?? [])]) {
      const match = Object.keys(row).find((k) => norm(k) === norm(key));
      if (match !== undefined) return row[match];
   }
   return undefined;
}

/**
 * Reads the first sheet. Returns { rows, headers }, each row carrying its spreadsheet row
 * number as `__row` (header is row 1). Fully empty rows are dropped.
 */
export async function readSheet(file) {
   const XLSX = await import("xlsx");
   const data = new Uint8Array(await file.arrayBuffer());
   const workbook = XLSX.read(data, { type: "array", cellDates: true });
   const sheet = workbook.Sheets[workbook.SheetNames[0]];
   if (!sheet) return { rows: [], headers: [] };

   const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
   const headers = (matrix[0] ?? []).map((h) => String(h).trim());
   const rows = [];
   for (let i = 1; i < matrix.length; i++) {
      const cells = matrix[i];
      if (!cells || cells.every(blank)) continue;
      const row = { __row: i + 1 };
      headers.forEach((h, c) => {
         if (h) row[h] = cells[c];
      });
      rows.push(row);
   }
   return { rows, headers };
}

/** Checks the file before reading it. Returns an error message or null. */
export function checkFile(file) {
   if (!file) return "Choose a file to import.";
   const name = file.name.toLowerCase();
   if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      return "That file type isn't supported. Use the Excel template (.xlsx), or a .xls or .csv file.";
   }
   if (file.size > MAX_FILE_BYTES) return "The file is larger than 5 MB. Split it into smaller files.";
   if (file.size === 0) return "The file is empty.";
   return null;
}

/** Message when the sheet doesn't look like the template (missing required columns), else null. */
export function missingColumnsMessage(headers, columns) {
   const have = headers.map(norm);
   const missing = columns
      .filter((c) => c.required)
      .filter((c) => ![c.header, ...(c.aliases ?? [])].some((h) => have.includes(norm(h))))
      .map((c) => c.header);
   if (!missing.length) return null;
   return `This file is missing the ${missing.length === 1 ? "column" : "columns"} ${missing
      .map((m) => `"${m}"`)
      .join(", ")}. Download the template and copy your rows into it.`;
}

// ───────────────────────── Items ─────────────────────────

export const ITEM_COLUMNS = [
   { key: "item_name", header: "Item Name", aliases: ["name"], required: true },
   { key: "category_id", header: "Category", aliases: ["Category ID"], required: true },
   { key: "unit", header: "Unit", required: true },
   { key: "price", header: "Price", required: true },
   { key: "status", header: "Status" },
   { key: "variant_name", header: "Variant Name", aliases: ["variant"] },
   { key: "reorder_level", header: "Reorder Level" },
   { key: "safe_qty_level", header: "Safe Qty Level", aliases: ["safe level"] },
   { key: "max_qty_level", header: "Max Qty Level", aliases: ["max level"] },
   { key: "stocks", header: "Stocks", aliases: ["quantity", "initial stock"] },
   { key: "expiration_date", header: "Expiration Date", aliases: ["expires", "expiry date", "expires at"] },
   { key: "date_received", header: "Date Received", aliases: ["received date", "received at"] },
];

const ITEM_DEFAULTS = { reorder_level: 5, safe_qty_level: 10, max_qty_level: 20 };

const unitFromCell = (value) => {
   const v = text(value).toLowerCase();
   const match = UNIT_OPTIONS.find((u) => u.value.toLowerCase() === v || u.label.toLowerCase() === v);
   return match?.value ?? null;
};

/**
 * Checks item rows. `categories` is the real category list. Returns
 * { rows: [{ row, label, sub, payload, errors }], groups } where an item (all rows with the same
 * name) is only importable when every one of its rows is clean.
 */
export function validateItemRows(sheetRows, { categories = [] } = {}) {
   const categoryById = new Map(categories.map((c) => [String(c.id), c]));
   const categoryByName = new Map(categories.map((c) => [String(c.name).trim().toLowerCase(), c]));
   const today = todayYmd();

   const rows = sheetRows.map((raw) => {
      const v = (key) => pick(raw, ITEM_COLUMNS.find((c) => c.key === key));
      const errors = [];

      const itemName = text(v("item_name"));
      if (!itemName) errors.push("Item Name is required.");
      else if (itemName.length > 255) errors.push("Item Name is longer than 255 characters.");

      const categoryCell = text(v("category_id"));
      let categoryId = null;
      const category = categoryByName.get(categoryCell.toLowerCase()) ?? categoryById.get(categoryCell);
      if (!categoryCell) errors.push("Category is required. Pick one from the list.");
      else if (!category) errors.push(`Category "${categoryCell}" doesn't exist. Pick one from the list.`);
      else categoryId = Number(category.id);

      const unitCell = text(v("unit"));
      const unit = unitFromCell(unitCell);
      if (!unitCell) errors.push("Unit is required. Pick one from the list.");
      else if (!unit) errors.push(`Unit "${unitCell}" isn't recognised. Pick one from the list.`);

      const price = cellMoney(v("price"));
      if (price === "") errors.push("Price is required.");
      else if (Number.isNaN(price)) errors.push("Price must be a number, e.g. 250 or 99.50.");
      else if (price <= 0) errors.push("Price must be more than 0.");

      const statusCell = text(v("status")).toLowerCase() || "active";
      if (!["active", "inactive"].includes(statusCell)) errors.push(`Status must be "active" or "inactive", not "${text(v("status"))}".`);

      const variantName = text(v("variant_name")) || "Default";
      if (variantName.length > 255) errors.push("Variant Name is longer than 255 characters.");

      const level = (key, label) => {
         const n = cellInt(v(key));
         if (n === "") return ITEM_DEFAULTS[key];
         if (Number.isNaN(n) || n < 0) {
            errors.push(`${label} must be a whole number of 0 or more.`);
            return null;
         }
         return n;
      };
      const reorder = level("reorder_level", "Reorder Level");
      const safe = level("safe_qty_level", "Safe Qty Level");
      const max = level("max_qty_level", "Max Qty Level");
      if (reorder != null && safe != null && max != null) {
         if (reorder > safe) errors.push("Reorder Level can't be higher than Safe Qty Level.");
         if (safe > max) errors.push("Safe Qty Level can't be higher than Max Qty Level.");
         if (max <= 0) errors.push("Max Qty Level must be more than 0.");
      }

      const stocks = cellInt(v("stocks"));
      if (stocks !== "" && (Number.isNaN(stocks) || stocks < 0)) errors.push("Stocks must be a whole number of 0 or more.");
      else if (stocks !== "" && max != null && stocks > max) errors.push(`Stocks (${stocks}) is more than the Max Qty Level (${max}).`);

      const received = cellDate(v("date_received"));
      if (received === null) errors.push("Date Received isn't a valid date. Use YYYY-MM-DD, e.g. 2026-01-15.");
      else if (received && received > today) errors.push("Date Received can't be in the future.");

      const expires = cellDate(v("expiration_date"));
      if (expires === null) errors.push("Expiration Date isn't a valid date. Use YYYY-MM-DD, e.g. 2027-12-31.");
      else if (expires && expires <= today) errors.push("Expiration Date must be after today.");
      if (expires && !(stocks > 0)) errors.push("Expiration Date is set but Stocks is empty. Add the quantity, or clear the date.");

      return {
         row: raw.__row,
         label: itemName || "(no name)",
         sub: variantName,
         key: itemName.toLowerCase(),
         errors,
         payload: {
            row: raw.__row,
            item_name: itemName,
            category_id: categoryId,
            unit,
            price: Number.isNaN(price) ? null : price,
            status: statusCell,
            variant_name: variantName,
            reorder_level: reorder,
            safe_qty_level: safe,
            max_qty_level: max,
            ...(stocks !== "" && !Number.isNaN(stocks) && { stocks }),
            ...(expires && { expiration_date: expires }),
            ...(received && { date_received: received }),
         },
      };
   });

   // Rows sharing an Item Name are one item: they must agree, and variant names must be unique
   const groups = new Map();
   rows.forEach((r) => {
      if (!r.key) return;
      if (!groups.has(r.key)) groups.set(r.key, []);
      groups.get(r.key).push(r);
   });
   for (const group of groups.values()) {
      const first = group[0].payload;
      const seen = new Set();
      group.forEach((r, i) => {
         const p = r.payload;
         const variantKey = p.variant_name.toLowerCase();
         if (seen.has(variantKey)) r.errors.push(`Variant "${p.variant_name}" is listed twice for ${p.item_name}.`);
         seen.add(variantKey);
         if (i === 0) return;
         const differs = [
            p.category_id !== first.category_id && "Category",
            p.unit !== first.unit && "Unit",
            p.price !== first.price && "Price",
         ].filter(Boolean);
         if (differs.length) {
            r.errors.push(`${differs.join(", ")} must match row ${group[0].row}, the first row for ${p.item_name}.`);
         }
      });
      // An item with any expiry date tracks expiry for all its batches
      const tracksExpiry = group.some((r) => r.payload.expiration_date);
      group.forEach((r) => {
         r.payload.has_expiry = tracksExpiry;
         if (tracksExpiry && r.payload.stocks > 0 && !r.payload.expiration_date) {
            r.errors.push(`${p(r)} tracks expiry (another row has an Expiration Date), so this row needs one too.`);
         }
      });
   }

   // A row is importable only if its whole item is clean, so an item is never created half-done
   for (const group of groups.values()) {
      const blocked = group.some((r) => r.errors.length);
      group.forEach((r) => {
         r.blockedByGroup = blocked && r.errors.length === 0;
      });
   }

   return { rows };
}

const p = (r) => r.payload.item_name;

// ───────────────────────── Stocks ─────────────────────────

/** The label the template's Item dropdown uses; unique because it carries the SKU. */
export const stockItemLabel = (option) => `${option.inventory_name ?? option.name} - ${option.variant_name ?? "Default"} (${option.sku})`;

export const STOCK_COLUMNS = [
   // The template's dropdown; files made from the old template use SKU + Variant Name instead
   { key: "item", header: "Item", aliases: ["SKU"], required: true },
   { key: "sku", header: "SKU" },
   { key: "variant_name", header: "Variant Name", aliases: ["variant"] },
   { key: "supplier_id", header: "Supplier", aliases: ["Supplier ID"], required: true },
   { key: "quantity", header: "Quantity", aliases: ["qty"], required: true },
   { key: "invoice_no", header: "Invoice No", aliases: ["invoice", "invoice number"] },
   { key: "received_at", header: "Received Date", aliases: ["date received", "received at"] },
   { key: "expires_at", header: "Expiration Date", aliases: ["expires", "expiry date", "expires at"] },
   { key: "remarks", header: "Remarks" },
];

/**
 * Checks stock rows against the real items (`options`: variants with sku, variant_name,
 * current_qty, max_qty_level, has_expiry) and suppliers. Quantities for the same variant are
 * added up across the file before comparing with the room left below its max level.
 */
export function validateStockRows(sheetRows, { options = [], suppliers = [] } = {}) {
   const today = todayYmd();
   const supplierById = new Map(suppliers.map((s) => [String(s.id), s]));
   const supplierByName = new Map(suppliers.map((s) => [String(s.name).trim().toLowerCase(), s]));
   const variantByLabel = new Map(options.map((o) => [stockItemLabel(o).toLowerCase(), o]));
   const variantByKey = new Map(
      options.map((o) => [`${String(o.sku).toLowerCase()}|${String(o.variant_name ?? "Default").toLowerCase()}`, o]),
   );
   const skus = new Set(options.map((o) => String(o.sku).toLowerCase()));
   const addedByVariant = new Map();

   const rows = sheetRows.map((raw) => {
      const v = (key) => pick(raw, STOCK_COLUMNS.find((c) => c.key === key));
      const errors = [];

      // Item dropdown label first; otherwise an SKU (+ Variant Name) from the old template
      const itemCell = text(v("item"));
      const skuCell = text(v("sku")) || itemCell;
      const variantName = text(v("variant_name")) || "Default";
      let variant = variantByLabel.get(itemCell.toLowerCase()) ?? null;
      const sku = variant?.sku ?? skuCell;
      if (!variant) {
         if (!itemCell && !skuCell) errors.push("Item is required. Pick one from the list.");
         else if (skus.has(skuCell.toLowerCase())) {
            variant = variantByKey.get(`${skuCell.toLowerCase()}|${variantName.toLowerCase()}`) ?? null;
            if (!variant) errors.push(`${skuCell} has no variant called "${variantName}". Pick the item from the list.`);
         } else {
            errors.push(`"${itemCell || skuCell}" doesn't match any item. Pick one from the list.`);
         }
      }

      const supplierCell = text(v("supplier_id"));
      const supplier = supplierByName.get(supplierCell.toLowerCase()) ?? supplierById.get(supplierCell);
      if (!supplierCell) errors.push("Supplier is required. Pick one from the list.");
      else if (!supplier) errors.push(`Supplier "${supplierCell}" doesn't exist. Pick one from the list.`);
      else if (supplier.status && supplier.status !== "active") errors.push(`Supplier ${supplier.name} is inactive.`);

      const quantity = cellInt(v("quantity"));
      if (quantity === "") errors.push("Quantity is required.");
      else if (Number.isNaN(quantity) || quantity <= 0) errors.push("Quantity must be a whole number more than 0.");

      const received = cellDate(v("received_at"));
      if (received === "") errors.push("Received Date is required.");
      else if (received === null) errors.push("Received Date isn't a valid date. Use YYYY-MM-DD, e.g. 2026-04-16.");
      else if (received > today) errors.push("Received Date can't be in the future.");

      const expires = cellDate(v("expires_at"));
      if (expires === null) errors.push("Expiration Date isn't a valid date. Use YYYY-MM-DD, e.g. 2027-12-31.");
      else if (variant?.has_expiry && !expires) errors.push("This item tracks expiry, so Expiration Date is required.");
      else if (variant && !variant.has_expiry && expires) errors.push("This item doesn't track expiry. Clear the Expiration Date.");
      else if (expires && expires <= today) errors.push("Expiration Date must be after today.");

      const invoice = text(v("invoice_no"));
      if (invoice.length > 100) errors.push("Invoice No is longer than 100 characters.");
      const remarks = text(v("remarks"));
      if (remarks.length > 255) errors.push("Remarks is longer than 255 characters.");

      // Room below the max level, checked last: only rows that will import count toward the running total
      if (!errors.length && variant) {
         const before = addedByVariant.get(variant.id) ?? 0;
         const room = Math.max(Number(variant.max_qty_level || 0) - Number(variant.current_qty || 0), 0);
         if (before + quantity > room) {
            errors.push(
               before
                  ? `Together with earlier rows this adds ${before + quantity}, but only ${room} more fit below the max level (${variant.max_qty_level}).`
                  : `Only ${room} more fit below the max level (${variant.max_qty_level}); this row adds ${quantity}.`,
            );
         } else {
            addedByVariant.set(variant.id, before + quantity);
         }
      }

      return {
         row: raw.__row,
         label: variant ? variant.name : sku || "(no SKU)",
         sub: supplier ? `${quantity || 0} from ${supplier.name}` : null,
         errors,
         payload: {
            row: raw.__row,
            sku,
            variant_name: variant?.variant_name ?? variantName,
            supplier_id: supplier ? Number(supplier.id) : null,
            quantity: Number.isNaN(quantity) ? null : quantity,
            invoice_no: invoice || "",
            received_at: received || "",
            ...(expires && { expires_at: expires }),
            remarks,
         },
      };
   });

   return { rows };
}
