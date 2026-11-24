import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import BulkImportFlow from "@/components/custom/BulkImportFlow";
import { useBulkCreateItemsMutation } from "@/features/api/inventory";
import { useGetCategoryListQuery } from "@/features/api/category";
import { setBulkImportFailures, setOpenBulkImportFailuresModal } from "@/features/slice/inventorySlice";
import { ITEM_COLUMNS, validateItemRows } from "@/helpers/bulkImport";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";

/** Bulk-create items (and their variants and starting stock) from the Excel template. */
export default function BulkCreate({ onClose }) {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const [bulkCreateItems] = useBulkCreateItemsMutation();
   const { data: categories, isSuccess: categoriesReady } = useGetCategoryListQuery();

   const validate = useCallback((rows) => validateItemRows(rows, { categories: categories ?? [] }), [categories]);

   const downloadTemplate = useCallback(async () => {
      const { downloadBulkImportTemplate } = await import("@/helpers/downloadExcelTemplate");
      await downloadBulkImportTemplate({ categories: categories ?? [] });
   }, [categories]);

   const submit = useCallback(
      async (items) => {
         const itemCount = new Set(items.map((i) => i.item_name.toLowerCase())).size;
         const confirmed = await confirm({
            title: "Import these items?",
            message: `${itemCount.toLocaleString()} ${itemCount === 1 ? "item" : "items"} (${items.length.toLocaleString()} ${
               items.length === 1 ? "row" : "rows"
            }) will be created.`,
         });
         if (!confirmed) return null;
         return exec(bulkCreateItems, { items });
      },
      [bulkCreateItems, confirm, exec],
   );

   const onFinished = useCallback(
      (importData, { success, message }) => {
         const { successful, failed } = importData.summary;
         if (!success) toast.error(message || "The import didn't go through. Nothing was saved.");
         else if (!failed) toast.success(`${successful.toLocaleString()} ${successful === 1 ? "row" : "rows"} imported.`);
         else if (successful) toast.warning(`${successful.toLocaleString()} imported, ${failed.toLocaleString()} not imported.`);
         else toast.error("No rows were imported.");

         if (failed > 0 || !success) {
            dispatch(setBulkImportFailures(importData));
            dispatch(setOpenBulkImportFailuresModal(true));
         }
         onClose();
      },
      [dispatch, onClose],
   );

   return (
      <BulkImportFlow
         noun={{ one: "row", many: "rows", refs: "categories and units" }}
         columns={ITEM_COLUMNS}
         validate={validate}
         refsReady={categoriesReady}
         downloadTemplate={downloadTemplate}
         submit={submit}
         onFinished={onFinished}
         onClose={onClose}
         retryNote='An item with problems is skipped as a whole, never half-created. Items that were imported are refused as duplicates, so importing the fixed file again is safe.'
      />
   );
}
