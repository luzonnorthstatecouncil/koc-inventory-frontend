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

   // Download file
   XLSX.writeFile(workbook, filename);
};
