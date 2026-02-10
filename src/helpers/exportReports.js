import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Export data to CSV format
 * @param {Array} data - Array of data objects
 * @param {Array} columns - Array of column definitions
 * @param {string} filename - Name of the file to download
 */
export const exportToCSV = (data, columns, filename = "report.csv") => {
   if (!data || data.length === 0) {
      alert("No data to export");
      return;
   }

   const groupedData = data.reduce((acc, row) => {
      const itemName = row.item_name || "Unknown";
      if (!acc[itemName]) {
         acc[itemName] = [];
      }
      acc[itemName].push(row);
      return acc;
   }, {});

   const wsData = [];

   const title = filename.replace(".csv", "").toUpperCase();
   const titleRow = [title];
   columns.slice(1).forEach(() => titleRow.push(""));
   wsData.push(titleRow);

   wsData.push([]);

   wsData.push(columns.map((col) => col.label));

   const categoryRowIndices = [];
   let currentRow = 3;

   Object.entries(groupedData).forEach(([itemName, items]) => {
      const categoryRow = [itemName];
      columns.slice(1).forEach(() => categoryRow.push(""));
      wsData.push(categoryRow);
      categoryRowIndices.push(currentRow);
      currentRow++;

      items.forEach((row) => {
         const rowData = columns.map((col) => {
            const value = col.accessor ? col.accessor(row) : row[col.key];
            return value ?? "";
         });
         wsData.push(rowData);
         currentRow++;
      });
   });

   const worksheet = XLSX.utils.aoa_to_sheet(wsData);

   const colWidths = columns.map((col) => ({ wch: 25 }));
   worksheet["!cols"] = colWidths;

   const merges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
   ];

   categoryRowIndices.forEach((rowIndex) => {
      merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: columns.length - 1 } });
   });
   worksheet["!merges"] = merges;

   const range = XLSX.utils.decode_range(worksheet["!ref"]);

   const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
   };

   for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
         font: { bold: true, sz: 14 },
         alignment: { horizontal: "center", vertical: "center" },
         fill: { fgColor: { rgb: "FFFFFF" } },
         border: borderStyle,
      };
   }

   for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
         font: { bold: true },
         alignment: { horizontal: "center", vertical: "center" },
         fill: { fgColor: { rgb: "FFFF00" } },
         border: borderStyle,
      };
   }

   categoryRowIndices.forEach((rowIndex, index) => {
      const isFirstCategory = index === 0;
      for (let col = range.s.c; col <= range.e.c; col++) {
         const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: col });
         if (!worksheet[cellAddress]) continue;
         worksheet[cellAddress].s = {
            font: { bold: true },
            alignment: { horizontal: "left", vertical: "center" },
            fill: { fgColor: { rgb: isFirstCategory ? "00B0F0" : "FFC000" } },
            border: borderStyle,
         };
      }
   });

   for (let row = range.s.r; row <= range.e.r; row++) {
      if (row === 0 || row === 1 || row === 2 || categoryRowIndices.includes(row)) continue;

      for (let col = range.s.c; col <= range.e.c; col++) {
         const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
         if (!worksheet[cellAddress]) continue;
         worksheet[cellAddress].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: borderStyle,
         };
      }
   }

   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

   const xlsxFilename = filename.replace(".csv", ".xlsx");
   XLSX.writeFile(workbook, xlsxFilename);
};

export const exportToPDF = (data, columns, title = "Report", filename = "report.pdf") => {
   if (!data || data.length === 0) {
      alert("No data to export");
      return;
   }

   const doc = new jsPDF("landscape");

   // Add title
   doc.setFontSize(16);
   doc.text(title, 14, 15);

   // Add date
   doc.setFontSize(10);
   doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

   // Group data by item_name
   const groupedData = data.reduce((acc, row) => {
      const itemName = row.item_name || "Unknown";
      if (!acc[itemName]) {
         acc[itemName] = [];
      }
      acc[itemName].push(row);
      return acc;
   }, {});

   // Prepare table headers
   const headers = columns.map((col) => col.label);

   // Prepare table rows with category headers
   const rows = [];
   Object.entries(groupedData).forEach(([itemName, items]) => {
      // Add category header row (spans all columns)
      rows.push([
         {
            content: itemName,
            colSpan: columns.length,
            styles: { fillColor: [255, 193, 7], fontStyle: "bold", halign: "left" },
         },
      ]);

      // Add variant rows
      items.forEach((row) => {
         const rowData = columns.map((col) => {
            const value = col.accessor ? col.accessor(row) : row[col.key];
            return value ?? "";
         });
         rows.push(rowData);
      });
   });

   // Add table
   autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      styles: {
         fontSize: 11,
         cellPadding: 2,
         halign: "center",
      },
      headStyles: {
         fillColor: [17, 40, 102],
         textColor: [255, 255, 255],
         fontStyle: "bold",
         halign: "center",
      },
      alternateRowStyles: {
         fillColor: [245, 245, 245],
      },
   });

   // Save PDF
   doc.save(filename);
};

/**
 * Get columns for Reorder Report
 */
export const getInventoryStatusColumns = () => [
   {
      key: "variant_name",
      label: "ITEM DESCRIPTION/S",
   },
   {
      key: "selling_price",
      label: "SELLING PRICE AS OF " + new Date().toLocaleDateString(),
   },
   // {
   //    key: "net_price",
   //    label: "NET PRICE",
   // },
   {
      key: "ending_balance",
      label: "ENDING BALANCE AS OF " + new Date().toLocaleDateString(),
      accessor: (row) => row.ending_balance || 0,
   },
   {
      key: "delivery_in",
      label: "DELIVERY IN AS OF " + new Date().toLocaleDateString(),
      accessor: (row) => row.delivery_in || 0,
   },
   // {
   //    key: "total_of_stocks",
   //    label: "TOTAL OF STOCKS AS OF",
   //    accessor: (row) => (row.ending_balance || 0) + (row.delivery_in || 0),
   // },
   {
      key: "total_stocks_sold",
      label: "TOTAL STOCKS SOLD",
      accessor: (row) => row.total_stocks_sold || 0,
   },
   {
      key: "stocks_left",
      label: "STOCKS LEFT AS OF " + new Date().toLocaleDateString(),
      accessor: (row) => {
         const total = (row.ending_balance || 0) + (row.delivery_in || 0);
         const sold = row.total_stocks_sold || 0;
         return total - sold;
      },
   },
];

/**
 * Export orders data to Excel format
 * @param {Array} data - Array of order data objects
 * @param {string} filename - Name of the file to download
 */
export const exportOrdersToExcel = (data, filename = "orders-export.xlsx") => {
   if (!data || data.length === 0) {
      alert("No data to export");
      return;
   }

   // Prepare data for export
   const exportData = data.map((order) => ({
      "Order Number": `#${String(order.id).padStart(6, "0")}`,
      "Order Ref No.": order.order_number || "",
      "Payment Method": order.payments?.payment_method || "",
      "Payment Status": order.payments?.status || "",
      "Total Amount": order.order_total || 0,
      "Items Count": order.items?.length || 0,
      "Date Checkout": order.created_at ? new Date(order.created_at).toLocaleString() : "",
      Refunded: order.refundedOrder ? "Yes" : "No",
   }));

   // Create worksheet
   const worksheet = XLSX.utils.json_to_sheet(exportData);

   // Set column widths
   const colWidths = [
      { wch: 15 }, // Order Number
      { wch: 20 }, // Order Ref No.
      { wch: 18 }, // Payment Method
      { wch: 18 }, // Payment Status
      { wch: 15 }, // Total Amount
      { wch: 12 }, // Items Count
      { wch: 25 }, // Date Checkout
      { wch: 10 }, // Refunded
   ];
   worksheet["!cols"] = colWidths;

   // Define border style
   const borderStyle = {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
   };

   // Apply styles to header row
   const range = XLSX.utils.decode_range(worksheet["!ref"]);
   for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
         font: { bold: true, color: { rgb: "FFFFFF" } },
         alignment: { horizontal: "center", vertical: "center" },
         fill: { fgColor: { rgb: "4472C4" } },
         border: borderStyle,
      };
   }

   // Apply styles to data rows
   for (let row = range.s.r + 1; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
         const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
         if (!worksheet[cellAddress]) continue;
         worksheet[cellAddress].s = {
            alignment: { horizontal: "center", vertical: "center" },
            border: borderStyle,
         };
      }
   }

   // Create workbook and save
   const workbook = XLSX.utils.book_new();
   XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
   XLSX.writeFile(workbook, filename);
};
