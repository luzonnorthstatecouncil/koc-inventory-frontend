import Paragraph from "@/components/custom/Paragraph";
import ITabs from "@/components/custom/Tabs";
import Title from "@/components/custom/Title";
import Form from "@/components/custom/Form";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";
import Details from "@/components/custom/Details";
import ISelect from "@/components/custom/Select";
import InputNumber from "@/components/custom/InputNumber";
import ITextarea from "@/components/custom/Textarea";

import { addOthers } from "@/helpers/parser";
import { AlertCircle, AlertTriangle, PackageMinus, PackagePlus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { ADJUSTMENT_STOCK_REMARKS_OPTIONS, REMOVE_STOCK_REMARKS_OPTIONS } from "@/constants/options";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { toast } from "sonner";
import { editStockDefaultValues, editStockSchema } from "@/lib/zod/schema/manageStock";
import { useFormContext } from "react-hook-form";
import { useAdjustStocksMutation } from "@/features/api/inventory";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Edit({ item, onClose }) {
   const { confirm } = useConfirmation();
   const [adjustStock] = useAdjustStocksMutation();
   const exec = useCatchQuery();

   const hasPendingStockRequest = useMemo(() => {
      return item?.variant?.stockRequests?.some((request) => request.status === "pending");
   }, [item]);

   const onSubmit = useCallback(async (data) => {
      if (item.current_quantity === data.quantity) {
         toast.error("Quantity must be different from current quantity.");
         return;
      }

      const confirmed = await confirm({
         title: "Adjustment",
         message: `This will change the ${item.current_quantity} stock${data.quantity > 1 ? "s" : ""} to ${
            data.quantity
         } stocks from ${item.reference_no}. Are you sure you want to proceed?`,
      });

      if (!confirmed) return;

      const formData = {
         ...data,
         remarks: data.remarks_others || data.remarks,
         current: item.current_quantity,
         adjustment_type: data.quantity > item.current_quantity ? "add" : "remove",
      };

      const { min_quantity, remarks_others, ...payload } = formData;

      const { success, message } = await exec(adjustStock, payload);
      if (!success) return;

      toast.success(message);
      onClose();
   }, [adjustStock, confirm, exec, item.current_quantity, item.reference_no, onClose]);

   return (
      <Form
         className='flex flex-col gap-4'
         onSubmit={onSubmit}
         schema={editStockSchema}
         defaultValues={{
            ...editStockDefaultValues,
            inventory_stock_id: item.id,
            quantity: item.current_quantity,
            min_quantity: item.current_quantity,
         }}
      >
         <StocksContent item={item} onClose={onClose} hasPendingStockRequest={hasPendingStockRequest} />
      </Form>
   );
}

function StocksContent({ item, onClose, hasPendingStockRequest }) {
   const { formState } = useFormContext();
   const formValues = useMemo(() => formState?.values, [formState?.values]);
   const formErrors = useMemo(() => formState?.errors, [formState?.errors]);

   return (
      <div className='w-full flex flex-col relative'>
         <Title className='grid grid-cols-2 gap-2' size='base' variant='default'>
            <span>
               {item.reference_no}
               <Paragraph className='font-normal'>
                  {item.inventory.name} - {item.variant.variant_name}
               </Paragraph>
            </span>
            <Paragraph size='sm' variant='muted' className='font-normal text-end flex items-center justify-end gap-1'>
               Current: <strong className='text-gray-800'>{item.current_quantity}</strong> /{" "}
               {item.variant.max_qty_level}
            </Paragraph>
         </Title>

         <Separator className='my-3' />

         {hasPendingStockRequest && (
            <Alert className='mb-2 border border-destructive bg-red-50'>
               <AlertDescription className='text-xs text-destructive flex items-center gap-2'>
                  <span>
                     <AlertTriangle className='size-4' />
                  </span>
                  There is a pending stock request for this item. Adjusting the stock now may affect the pending
                  request.
               </AlertDescription>
            </Alert>
         )}

         <Alert className='mb-4 border border-primary bg-blue-50'>
            <AlertDescription className='text-xs text-primary flex items-center gap-2'>
               <span>
                  <AlertTriangle className='size-4' />
               </span>
               This tool automatically calculates the difference and adjusts the stock level accordingly (removing or
               adding units).
            </AlertDescription>
         </Alert>

         <div className='relative mb-3'>
            <div className='flex items-center justify-between gap-3 mb-3'>
               <div className='flex flex-col'>
                  <Details label='Number of Item' description='Enter the desired total item of the stock.' />
                  {formErrors.quantity && (
                     <span className='text-destructive text-xs'>{formErrors.quantity.message}</span>
                  )}
               </div>

               <InputNumber
                  max={item.variant.max_qty_level}
                  name='quantity'
                  steps={10}
                  disabled={hasPendingStockRequest}
               />
            </div>

            <ISelect
               showAll={false}
               name='remarks'
               label='Remarks'
               triggerClassName='bg-white'
               relatedKeys={["remarks_others"]}
               disabled={hasPendingStockRequest}
               options={addOthers(
                  formValues?.quantity <= item.current_quantity
                     ? REMOVE_STOCK_REMARKS_OPTIONS
                     : ADJUSTMENT_STOCK_REMARKS_OPTIONS,
               )}
            />

            {formValues?.remarks === "others" && (
               <ITextarea
                  name='remarks_others'
                  placeholder='State other reason here...'
                  className='bg-white'
                  wrapperClassName='mt-2'
               />
            )}
         </div>

         <div className='flex items-center justify-end gap-2 mt-2'>
            <IButtonConfirm
               title='Cancel Editing'
               message='Are you sure you want to cancel? All unsaved changes will be lost.'
               asButton
               onConfirm={onClose}
            >
               Cancel
            </IButtonConfirm>
            <IButton
               type='submit'
               variant='default'
               disabled={hasPendingStockRequest || formValues?.quantity === item.current_quantity}
            >
               Save Changes
            </IButton>
         </div>
      </div>
   );
}
