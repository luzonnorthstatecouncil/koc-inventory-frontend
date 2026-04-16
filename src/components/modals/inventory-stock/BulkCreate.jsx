import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { useConfirmation } from "@/helpers/confirmAction";
import { useBulkCreateStocksMutation } from "@/features/api/inventory";
import { useGetSupplierListQuery } from "@/features/api/supplier";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { downloadBulkStockImportTemplate } from "@/helpers/downloadExcelTemplate";
import { setBulkImportFailures, setOpenBulkImportFailuresModal } from "@/features/slice/inventoryStockSlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useCallback, useState, useRef } from "react";
import { FileSpreadsheet, Upload, X, Download } from "lucide-react";
import * as XLSX from "xlsx";

export default function BulkCreate({ onClose }) {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const [bulkCreateStocks] = useBulkCreateStocksMutation();
   const exec = useCatchQuery();
   const { data: supplierList = [] } = useGetSupplierListQuery({ pageSize: 1000, status: "active" });

   const [file, setFile] = useState(null);
   const [parsedData, setParsedData] = useState([]);
   const [isProcessing, setIsProcessing] = useState(false);
   const fileInputRef = useRef(null);

   const handleFileSelect = useCallback((e) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
         toast.error("Please select a valid Excel file (.xlsx, .xls, or .csv)");
         return;
      }

      if (selectedFile.size > 5 * 1024 * 1024) {
         toast.error("File size must not exceed 5MB");
         return;
      }

      setFile(selectedFile);
      parseExcelFile(selectedFile);
   }, []);

   const parseExcelFile = useCallback((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
         try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const stocks = transformExcelData(jsonData);
            setParsedData(stocks);
         } catch (error) {
            toast.error("Failed to parse Excel file: " + error.message);
            setFile(null);
         }
      };

      reader.onerror = () => {
         toast.error("Failed to read file");
         setFile(null);
      };

      reader.readAsArrayBuffer(file);
   }, []);

   const transformExcelData = useCallback((data) => {
      const stocks = [];

      data.forEach((row) => {
         const sku = row["SKU"] || row["sku"];

         const stock = {
            sku,
            variant_name: row["Variant Name"] || row["variant_name"] || "Default",
            supplier_id: parseInt(row["Supplier ID"] || row["supplier_id"] || 0),
            quantity: parseInt(row["Quantity"] || row["quantity"] || 0),
            invoice_no: row["Invoice No"] || row["invoice_no"] || "",
            received_at: row["Received Date"] || row["received_at"] || "",
            remarks: row["Remarks"] || row["remarks"] || "",
         };

         const expirationDate = row["Expiration Date"] || row["expiration_date"] || row["expires_at"];
         if (expirationDate) {
            stock.expires_at = expirationDate;
         }

         stocks.push(stock);
      });

      return stocks;
   }, []);

   const handleBulkImport = useCallback(async () => {
      const confirmed = await confirm({
         title: "Confirm Bulk Stock Import",
         message: `Are you sure you want to import ${parsedData.length} stock entr${parsedData.length === 1 ? "y" : "ies"}?`,
      });

      if (!confirmed) return;

      setIsProcessing(true);
      const id = toast.loading(`Importing ${parsedData.length} stock entr${parsedData.length === 1 ? "y" : "ies"}...`);

      const payload = { stocks: parsedData };
      const { success, message, result } = await exec(bulkCreateStocks, payload);

      setIsProcessing(false);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      const { data: importData } = result ?? {};
      const failedCount = importData?.summary?.failed ?? 0;
      const successfulCount = importData?.summary?.successful ?? 0;

      if (failedCount === 0) {
         toast.success(
            message ?? `All ${successfulCount} stock entr${successfulCount === 1 ? "y" : "ies"} imported successfully.`,
            { id },
         );
      }

      if (failedCount > 0 && successfulCount > 0) {
         toast.warning(message ?? `Import completed. ${successfulCount} succeeded, ${failedCount} failed.`, { id });
      }

      if (failedCount > 0 && successfulCount === 0) {
         toast.warning(message ?? `All ${failedCount} stock entr${failedCount === 1 ? "y" : "ies"} failed to import.`, {
            id,
         });
      }

      if (failedCount > 0) {
         dispatch(setBulkImportFailures(importData));
         dispatch(setOpenBulkImportFailuresModal(true));
      }

      onClose();
   }, [parsedData, confirm, exec, bulkCreateStocks, onClose]);

   const handleRemoveFile = useCallback(() => {
      setFile(null);
      setParsedData([]);
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
   }, []);

   return (
      <div className='flex flex-col gap-4'>
         <div className='flex items-start justify-between gap-4'>
            <header>
               <Title size='lg' className='font-semibold'>
                  Upload Excel File
               </Title>
               <Paragraph variant='muted'>
                  Select an Excel file (.xlsx, .xls, or .csv) containing the stock entries you wish to import. You can
                  download a template to get started.
               </Paragraph>
            </header>
            <IButton
               type='button'
               variant='outline'
               size='sm'
               onClick={() => downloadBulkStockImportTemplate(supplierList?.data ?? [])}
            >
               <Download className='mr-2 h-4 w-4' />
               Download Template
            </IButton>
         </div>

         <div className='border-2 border-dashed rounded-lg p-5 text-center hover:border-primary transition-colors'>
            {!file ? (
               <div className='flex flex-col items-center'>
                  <FileSpreadsheet className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
                  <input
                     ref={fileInputRef}
                     type='file'
                     accept='.xlsx,.xls,.csv'
                     onChange={handleFileSelect}
                     className='hidden'
                     id='stock-file-upload'
                  />
                  <label htmlFor='stock-file-upload' className='cursor-pointer'>
                     <IButton type='button' variant='outline' asChild onClick={() => {}}>
                        <span>
                           <Upload className='mr-2 h-4 w-4' />
                           Select Excel File
                        </span>
                     </IButton>
                  </label>
                  <Paragraph variant='muted' className='mt-2'>
                     Supports .xlsx, .xls, and .csv formats
                  </Paragraph>
               </div>
            ) : (
               <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                     <FileSpreadsheet className='h-8 w-8 text-green-500' />
                     <div className='text-left'>
                        <Paragraph className='font-medium'>{file.name}</Paragraph>
                        <Paragraph size='sm' variant='muted'>
                           {parsedData.length} stock entr{parsedData.length === 1 ? "y" : "ies"} found
                        </Paragraph>
                     </div>
                  </div>
                  <IButton type='button' variant='ghost' size='sm' onClick={handleRemoveFile}>
                     <X className='h-4 w-4' />
                  </IButton>
               </div>
            )}
         </div>

         <div className='flex items-center justify-end gap-2'>
            <IButtonConfirm
               title='Cancel Import'
               message='Are you sure you want to cancel? The uploaded file will be discarded.'
               asButton
               onConfirm={onClose}
               isDirty={!!file}
            >
               Cancel
            </IButtonConfirm>
            <IButton
               type='button'
               variant='default'
               onClick={handleBulkImport}
               disabled={!file || isProcessing}
            >
               {isProcessing
                  ? "Importing..."
                  : `Import ${parsedData.length} Entr${parsedData.length === 1 ? "y" : "ies"}`}
            </IButton>
         </div>
      </div>
   );
}
