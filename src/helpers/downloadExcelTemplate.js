import { UNIT_OPTIONS } from "@/constants/options";
import * as XLSX from "xlsx";

/**
 * Downloads an Excel template for bulk import
 * @param {string} filename - Name of the file to download
 */
export const downloadBulkImportTemplate = (filename = "bulk_import_template.xlsx") => {
   // Sample data showing the expected format
   const sampleData = [
      {
         "Item Name": "Laptop",
         "Category ID": "1",
         Unit: "pcs",
         Price: 999.99,
         Status: "active",
         "Variant Name": "15-inch",
         "Reorder Level": 5,
         "Safe Qty Level": 40,
         "Max Qty Level": 120,
         Stocks: 50,
         "Expiration Date": "2026-12-31",
         "Date Received": "2025-01-15",
      },
      {
         "Item Name": "Laptop",
         "Category ID": "1",
         Unit: "pcs",
         Price: 999.99,
         Status: "active",
         "Variant Name": "17-inch",
         "Reorder Level": 3,
         "Safe Qty Level": 68,
         "Max Qty Level": 150,
         Stocks: 30,
         "Expiration Date": "2026-12-31",
         "Date Received": "2025-01-15",
      },
      {
         "Item Name": "Mouse",
         "Category ID": "2",
         Unit: "pcs",
         Price: 29.99,
         Status: "active",
         "Variant Name": "Wireless",
         "Reorder Level": 10,
         "Safe Qty Level": 20,
         "Max Qty Level": 50,
         Stocks: "",
         "Expiration Date": "",
         "Date Received": "2025-02-20",
      },
   ];

   // Create worksheet
   const worksheet = XLSX.utils.json_to_sheet(sampleData);

   // Set column widths
   worksheet["!cols"] = [
      { wch: 20 }, // Item Name
      { wch: 12 }, // Category ID
      { wch: 8 }, // Unit
      { wch: 10 }, // Price
      { wch: 10 }, // Status
      { wch: 15 }, // Variant Name
      { wch: 15 }, // Reorder Level
      { wch: 15 }, // Safe Qty Level
      { wch: 15 }, // Max Qty Level
      { wch: 10 }, // Stocks
      { wch: 15 }, // Expiration Date
      { wch: 15 }, // Date Received
   ];

   // Create workbook
   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, "Items");

   // Add instructions sheet
   const instructions = [
      { Instruction: "1. Fill in the item details in the 'Items' sheet" },
      { Instruction: "2. Each row represents one item-variant combination" },
      { Instruction: "3. For items with multiple variants, add multiple rows with the same Item Name" },
      { Instruction: "4. Item Name, Category ID, Unit, and Price are required fields" },
      { Instruction: "5. Status can be 'active' or 'inactive' (defaults to active)" },
      { Instruction: "6. Variant Name defaults to 'Default' if not provided" },
      { Instruction: "7. Stock levels (Reorder, Safe, Max) are optional and default to 5, 10, 20" },
      { Instruction: "8. Stocks field is optional - leave empty if not setting initial inventory" },
      { Instruction: "9. Expiration Date is optional" },
      { Instruction: "10. Expiration Date must be in YYYY-MM-DD format (e.g., 2026-12-31) when provided" },
      { Instruction: "11. Date Received must be in YYYY-MM-DD format (e.g., 2025-01-15)" },
      { Instruction: "12. Save the file and upload it in the Bulk Import dialog" },
   ];

   const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
   instructionsSheet["!cols"] = [{ wch: 80 }];
   XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

   const categories = [
      { ID: "1", Name: "Apparel" },
      { ID: "2", Name: "Miscellaneous" },
      { ID: "3", Name: "Electronics" },
      { ID: "4", Name: "Furniture" },
   ];

   const categoriesSheet = XLSX.utils.json_to_sheet(categories);
   categoriesSheet["!cols"] = [{ wch: 10 }, { wch: 30 }];
   XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories");

   const unitSheet = XLSX.utils.json_to_sheet(UNIT_OPTIONS.map((unit) => ({ Value: unit.value, Unit: unit.label })));
   unitSheet["!cols"] = [{ wch: 15 }];
   XLSX.utils.book_append_sheet(workbook, unitSheet, "Units");

   const suppliers = [
      { ID: "1", Name: "Supplier A", Status: "active" },
      { ID: "2", Name: "Supplier B", Status: "active" },
      { ID: "3", Name: "Supplier C", Status: "inactive" },
   ];

   const suppliersSheet = XLSX.utils.json_to_sheet(suppliers);
   suppliersSheet["!cols"] = [{ wch: 10 }, { wch: 30 }, { wch: 12 }];
   XLSX.utils.book_append_sheet(workbook, suppliersSheet, "Suppliers");

   // Download file
   XLSX.writeFile(workbook, filename);
};

/**
 * Downloads an Excel template for bulk stock import
 * @param {Array} suppliers - List of supplier objects with id, name, status
 * @param {string} filename - Name of the file to download
 */
export const downloadBulkStockImportTemplate = (suppliers = [], filename = "bulk_stock_import_template.xlsx") => {
   const sampleData = [
      {
         SKU: "ITEM-001",
         "Variant Name": "Default",
         "Supplier ID": "1",
         Quantity: 50,
         "Invoice No": "INV-001",
         "Received Date": "2026-04-16",
         "Expiration Date": "2027-12-31",
         Remarks: "Initial stock",
      },
      {
         SKU: "ITEM-002",
         "Variant Name": "Large",
         "Supplier ID": "2",
         Quantity: 100,
         "Invoice No": "INV-002",
         "Received Date": "2026-04-16",
         "Expiration Date": "",
         Remarks: "",
      },
   ];

   const worksheet = XLSX.utils.json_to_sheet(sampleData);
   worksheet["!cols"] = [
      { wch: 15 }, // SKU
      { wch: 20 }, // Variant Name
      { wch: 12 }, // Supplier ID
      { wch: 12 }, // Quantity
      { wch: 18 }, // Invoice No
      { wch: 15 }, // Received Date
      { wch: 15 }, // Expiration Date
      { wch: 30 }, // Remarks
   ];

   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, "Stocks");

   const instructions = [
      { Instruction: "1. Fill in the stock details in the 'Stocks' sheet" },
      { Instruction: "2. Each row represents one stock batch entry" },
      { Instruction: "3. SKU and Variant Name are used to identify the inventory item" },
      { Instruction: "4. SKU, Variant Name, Supplier ID, Quantity, and Received Date are required fields" },
      { Instruction: "5. Quantity must be a positive integer" },
      { Instruction: "6. Received Date must be in YYYY-MM-DD format (e.g., 2026-04-16)" },
      { Instruction: "7. Expiration Date is optional - leave empty for non-expiring items" },
      { Instruction: "8. Expiration Date must be in YYYY-MM-DD format when provided" },
      { Instruction: "9. Invoice No is optional" },
      { Instruction: "10. Remarks is optional" },
      { Instruction: "11. Save the file and upload it in the Bulk Import dialog" },
   ];

   const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
   instructionsSheet["!cols"] = [{ wch: 80 }];
   XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

   const suppliersSheet = XLSX.utils.json_to_sheet(
      suppliers.length > 0
         ? suppliers.map((s) => ({ ID: s.id, Name: s.name, Status: s.status }))
         : [{ ID: "", Name: "No suppliers found", Status: "" }]
   );
   suppliersSheet["!cols"] = [{ wch: 10 }, { wch: 30 }, { wch: 12 }];
   XLSX.utils.book_append_sheet(workbook, suppliersSheet, "Suppliers");

   XLSX.writeFile(workbook, filename);
};
