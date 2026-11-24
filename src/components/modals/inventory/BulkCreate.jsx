import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import Datatable from "@/components/custom/Datatable";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { useConfirmation } from "@/helpers/confirmAction";
import { useBulkCreateItemsMutation } from "@/features/api/inventory";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { setBulkImportFailures, setOpenBulkImportFailuresModal } from "@/features/slice/inventorySlice";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { useCallback, useState, useRef } from "react";
import { FileSpreadsheet, Upload, X, Download } from "lucide-react";

export default function BulkCreate({ onClose }) {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const [bulkCreateItems] = useBulkCreateItemsMutation();
   const exec = useCatchQuery();

   const [file, setFile] = useState(null);
   const [parsedData, setParsedData] = useState([]);
   const [isProcessing, setIsProcessing] = useState(false);
   const fileInputRef = useRef(null);

   // Defined in dependency order: each callback only references ones declared above it
   const transformExcelData = useCallback((data) => {
      const items = [];

      data.forEach((row) => {
         const itemName = row["Item Name"] || row["item_name"] || row["name"];

         const item = {
            item_name: itemName,
            category_id: parseInt(row["Category ID"] || row["category_id"] || 0),
            unit: row["Unit"] || row["unit"] || "",
            price: parseFloat(row["Price"] || row["price"] || 0),
            status: (row["Status"] || row["status"] || "active").toLowerCase(),
            variant_name: row["Variant Name"] || row["variant_name"] || "Default",
            reorder_level: parseInt(row["Reorder Level"] || row["reorder_level"] || 5),
            safe_qty_level: parseInt(row["Safe Qty Level"] || row["safe_qty_level"] || 10),
            max_qty_level: parseInt(row["Max Qty Level"] || row["max_qty_level"] || 20),
         };

         // Add stocks if present
         const stocks = row["Stocks"] || row["stocks"];
         if (stocks !== undefined && stocks !== null && stocks !== "") {
            item.stocks = parseInt(stocks);

            // Add expiration date only when stocks are provided
            const expirationDate = row["Expiration Date"] || row["expiration_date"] || row["expires_at"];
            if (expirationDate) {
               item.expiration_date = expirationDate;
            }
         }

         items.push(item);
      });

      return items;
   }, []);

   const parseExcelFile = useCallback((file) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
         try {
            // Spreadsheet parser loads only when a file is actually imported
            const XLSX = await import("xlsx");
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const items = transformExcelData(jsonData);
            setParsedData(items);
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
   }, [transformExcelData]);

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
   }, [parseExcelFile]);

   const handleBulkImport = useCallback(async () => {
      const confirmed = await confirm({
         title: "Confirm Bulk Import",
         message: `Are you sure you want to import ${parsedData.length} item(s)?`,
      });

      if (!confirmed) return;

      setIsProcessing(true);
      const id = toast.loading(`Importing ${parsedData.length} item(s)...`);

      const payload = { items: parsedData };
      const { success, message, result, errors } = await exec(bulkCreateItems, payload);

      setIsProcessing(false);

      if (!success) {
         if (errors?.length) {
            toast.warning(message ?? "Some entries failed validation.", { id });
            const importData = {
               failed: errors.map((err) => ({ error: err })),
               summary: { total: parsedData.length, successful: 0, failed: errors.length },
            };
            dispatch(setBulkImportFailures(importData));
            dispatch(setOpenBulkImportFailuresModal(true));
         } else {
            toast.dismiss(id);
         }
         onClose();
         return;
      }

      const { data: importData } = result ?? {};
      const failedCount = importData?.summary?.failed ?? 0;
      const successfulCount = importData?.summary?.successful ?? 0;

      if (failedCount === 0) {
         toast.success(
            message ?? `All ${successfulCount} item${successfulCount === 1 ? "" : "s"} imported successfully.`,
            { id },
         );
      }

      if (failedCount > 0 && successfulCount > 0) {
         toast.warning(message ?? `Import completed. ${successfulCount} succeeded, ${failedCount} failed.`, { id });
      }

      if (failedCount > 0 && successfulCount === 0) {
         toast.warning(message ?? `All ${failedCount} item${failedCount === 1 ? "" : "s"} failed to import.`, { id });
      }

      if (failedCount > 0) {
         dispatch(setBulkImportFailures(importData));
         dispatch(setOpenBulkImportFailuresModal(true));
      }

      onClose();
   }, [confirm, parsedData, exec, bulkCreateItems, onClose, dispatch]);

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
                  Select an Excel file (.xlsx, .xls, or .csv) containing the items you wish to import into the
                  inventory. You can download a template to get started.
               </Paragraph>
            </header>
            <IButton type='button' variant='outline' size='sm' onClick={async () => (await import("@/helpers/downloadExcelTemplate")).downloadBulkImportTemplate()}>
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
                     id='file-upload'
                  />
                  <label htmlFor='file-upload' className='cursor-pointer'>
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
                           {parsedData.length} item(s) found
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
            <IButton type='button' variant='default' onClick={handleBulkImport} disabled={!file || isProcessing}>
               {isProcessing ? "Importing..." : `Import ${parsedData.length} Item(s)`}
            </IButton>
         </div>
      </div>
   );
}
