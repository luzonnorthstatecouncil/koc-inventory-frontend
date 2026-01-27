import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import Datatable from "@/components/custom/Datatable";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { useConfirmation } from "@/helpers/confirmAction";
import { useBulkCreateItemsMutation } from "@/features/api/inventory";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { downloadBulkImportTemplate } from "@/helpers/downloadExcelTemplate";
import { toast } from "sonner";
import { useCallback, useState, useRef } from "react";
import { FileSpreadsheet, Upload, X, Download } from "lucide-react";
import * as XLSX from "xlsx";

export default function BulkCreate({ onClose }) {
   const { confirm } = useConfirmation();
   const [bulkCreateItems] = useBulkCreateItemsMutation();
   const exec = useCatchQuery();

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

            // Transform Excel data to match schema
            const items = transformExcelData(jsonData);
            setParsedData(items);

            if (items.length === 0) {
               toast.warning("No valid items found in the Excel file");
            } else {
               toast.success(`Successfully parsed ${items.length} item(s)`);
            }
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
      const items = [];

      data.forEach((row) => {
         const itemName = row["Item Name"] || row["item_name"] || row["name"];
         if (!itemName) return;

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

   const handleBulkImport = useCallback(async () => {
      if (parsedData.length === 0) {
         toast.error("No items to import");
         return;
      }

      const confirmed = await confirm({
         title: "Confirm Bulk Import",
         message: `Are you sure you want to import ${parsedData.length} item(s)?`,
      });

      if (!confirmed) return;

      setIsProcessing(true);
      const id = toast.loading(`Importing ${parsedData.length} item(s)...`);

      const payload = { items: parsedData };
      const { success, message } = await exec(bulkCreateItems, payload);

      setIsProcessing(false);

      if (success) {
         toast.success(`Successfully imported ${parsedData.length} item(s)`, { id });
         onClose();
      }
   }, [parsedData, confirm, exec, bulkCreateItems, onClose]);

   const handleRemoveFile = useCallback(() => {
      setFile(null);
      setParsedData([]);
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
   }, []);

   const columns = [
      { key: "item_name", label: "Item Name" },
      { key: "variant_name", label: "Variant" },
      { key: "category_id", label: "Category ID" },
      { key: "unit", label: "Unit" },
      { key: "price", label: "Price", render: (row) => `$${row.price.toFixed(2)}` },
      { key: "stocks", label: "Stocks", render: (row) => row.stocks ?? "-" },
      { key: "expiration_date", label: "Expiration Date", render: (row) => row.expiration_date || "-" },
   ];

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
            <IButton type='button' variant='outline' size='sm' onClick={() => downloadBulkImportTemplate()}>
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
            <IButton
               type='button'
               variant='default'
               onClick={handleBulkImport}
               disabled={parsedData.length === 0 || isProcessing}
            >
               {isProcessing ? "Importing..." : `Import ${parsedData.length} Item(s)`}
            </IButton>
         </div>
      </div>
   );
}
