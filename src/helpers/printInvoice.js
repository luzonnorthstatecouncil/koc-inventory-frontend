/**
 * Print invoice by opening it in a new window/tab
 * @param {Object} transactionData - The transaction data including cart, payment info, totals
 * @param {string} transactionId - The transaction/order ID
 * @param {Date} timestamp - The transaction timestamp
 */
export const printInvoice = (transactionData, transactionId, timestamp = new Date()) => {
   // Create invoice data object
   const invoiceData = {
      transactionData,
      transactionId,
      timestamp: timestamp.toISOString(),
   };

   // Store in sessionStorage to pass to new window
   sessionStorage.setItem('invoiceData', JSON.stringify(invoiceData));

   // Open invoice in new window
   const invoiceWindow = window.open('/invoice', '_blank', 'width=400,height=800');
   
   // Fallback: if popup blocked, try opening in same tab
   if (!invoiceWindow) {
      window.open('/invoice', '_blank');
   }
};

/**
 * Generate and download invoice as PDF (alternative method)
 * This requires additional library like html2pdf.js or jsPDF
 */
export const downloadInvoicePDF = async (transactionData, transactionId) => {
   // This can be implemented later with libraries like:
   // - html2pdf.js
   // - jsPDF
   // - react-pdf
   console.log("PDF download feature - to be implemented");
};
