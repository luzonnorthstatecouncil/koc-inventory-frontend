import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import BulkImportFlow from "@/components/custom/BulkImportFlow";
import { useBulkCreateStocksMutation, useGetInventoryAsOptionsQuery } from "@/features/api/inventory";
import { useGetSupplierListQuery } from "@/features/api/supplier";
import { setBulkImportFailures, setOpenBulkImportFailuresModal } from "@/features/slice/inventoryStockSlice";
import { STOCK_COLUMNS, validateStockRows } from "@/helpers/bulkImport";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";

/** Bulk stock-in from the Excel template. Supervisors' rows become approval requests. */
export default function BulkCreate({ onClose }) {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const [bulkCreateStocks] = useBulkCreateStocksMutation();
   const isSupervisor = useSelector((state) => state.user.user?.role) === "supervisor";

   const { data: options, isSuccess: optionsReady } = useGetInventoryAsOptionsQuery({}, { refetchOnMountOrArgChange: true });
   // Every supplier, so an inactive one in the file is named as inactive rather than "doesn't exist"
   const { data: supplierList, isSuccess: suppliersReady } = useGetSupplierListQuery({ pageSize: 1000 });
   const suppliers = useMemo(() => supplierList?.data ?? [], [supplierList]);

   const validate = useCallback(
      (rows) => validateStockRows(rows, { options: options ?? [], suppliers }),
      [options, suppliers],
   );

   const downloadTemplate = useCallback(async () => {
      const { downloadBulkStockImportTemplate } = await import("@/helpers/downloadExcelTemplate");
      await downloadBulkStockImportTemplate({ options: options ?? [], suppliers });
   }, [options, suppliers]);

   const submit = useCallback(
      async (stocks) => {
         const units = stocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
         const confirmed = await confirm({
            title: isSupervisor ? "Request this stock?" : "Import this stock?",
            message: `${stocks.length.toLocaleString()} ${stocks.length === 1 ? "batch" : "batches"} · ${units.toLocaleString()} units${
               isSupervisor ? " will be sent to an administrator for approval." : " will be added."
            }`,
         });
         if (!confirmed) return null;
         return exec(bulkCreateStocks, { stocks });
      },
      [bulkCreateStocks, confirm, exec, isSupervisor],
   );

   const onFinished = useCallback(
      (importData, { success, message, requiresApproval }) => {
         const { successful, failed } = importData.summary;
         const done = requiresApproval ? "sent for approval" : "imported";
         if (!success) toast.error(message || "The import didn't go through. Nothing was saved.");
         else if (!failed) toast.success(`${successful.toLocaleString()} ${successful === 1 ? "batch" : "batches"} ${done}.`);
         else if (successful) toast.warning(`${successful.toLocaleString()} ${done}, ${failed.toLocaleString()} not ${done}.`);
         else toast.error(`No batches were ${done}.`);

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
         noun={{ one: "batch", many: "batches", refs: "items and suppliers" }}
         columns={STOCK_COLUMNS}
         validate={validate}
         refsReady={optionsReady && suppliersReady}
         downloadTemplate={downloadTemplate}
         submit={submit}
         onFinished={onFinished}
         onClose={onClose}
         retryNote='Before importing the fixed file again, delete the rows that were already imported, or their stock will be added twice.'
      />
   );
}
