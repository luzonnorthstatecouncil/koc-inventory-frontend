import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceTemplate from "@/components/custom/InvoiceTemplate";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";

export default function InvoicePage() {
   const navigate = useNavigate();
   const [invoiceData, setInvoiceData] = useState(null);

   useEffect(() => {
      // Get invoice data from sessionStorage
      const data = sessionStorage.getItem("invoiceData");
      
      if (data) {
         try {
            const parsed = JSON.parse(data);
            setInvoiceData(parsed);
         } catch (error) {
            console.error("Failed to parse invoice data:", error);
         }
      }
   }, []);

   const handlePrint = () => {
      window.print();
   };

   const handleClose = () => {
      window.close();
      // Fallback if window.close() doesn't work (for main tabs)
      setTimeout(() => {
         navigate(-1);
      }, 100);
   };

   if (!invoiceData) {
      return (
         <div className="flex items-center justify-center h-screen">
            <div className="text-center">
               <p className="text-lg text-gray-600 mb-4">No invoice data found</p>
               <Button onClick={handleClose}>Close</Button>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-gray-100 print:bg-white">
         {/* Print Controls - Hidden when printing */}
         <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
            <Button onClick={handlePrint} className="flex items-center gap-2">
               <Printer className="size-4" />
               Print
            </Button>
            <Button onClick={handleClose} variant="outline" className="flex items-center gap-2">
               <X className="size-4" />
               Close
            </Button>
         </div>

         {/* Invoice Template */}
         <div className="py-8 print:py-0">
            <InvoiceTemplate
               transactionData={invoiceData.transactionData}
               transactionId={invoiceData.transactionId}
               timestamp={new Date(invoiceData.timestamp)}
            />
         </div>
      </div>
   );
}
