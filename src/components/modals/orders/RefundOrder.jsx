import { useMemo, useState } from "react";
import { Info, Minus, Plus } from "lucide-react";
import Modal from "@/components/custom/Modal";
import { padwithZero, priceParser } from "@/helpers/parser";
import { ScrollArea } from "@/components/ui/scroll-area";
import ISelect from "@/components/custom/Select";
import { REFUND_REASONS_OPTIONS } from "@/constants/options";
import ITextarea from "@/components/custom/Textarea";
import Form from "@/components/custom/Form";
import { refundOrderDefaultValues, refundOrderSchema } from "@/lib/zod/schema/refundOrder";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import IButton from "@/components/custom/Button";
import { describeOrderItem } from "@/helpers/orderItems";
import { Note, OrderHeader, OrderLines } from "./ui/OrderParts";

const refundableOf = (item) => item.refundable_quantity ?? item.quantity;

const stepClass =
   "flex w-8 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent focus-visible:relative focus-visible:outline-2 focus-visible:outline-primary";

/**
 * Refund all or part of a sale. Each line starts at everything still refundable; lower a line
 * to return only some items. Sends `items` only for a partial refund, so a full refund returns
 * exactly what was charged.
 */
export default function RefundOrder({ isOpen, onClose, onConfirm, order: selectedOrder }) {
   const lines = useMemo(
      () => (selectedOrder?.items || []).filter((item) => refundableOf(item) > 0),
      [selectedOrder],
   );
   const [qty, setQty] = useState(() => Object.fromEntries(lines.map((item) => [item.id, refundableOf(item)])));

   const setAll = (all) => setQty(Object.fromEntries(lines.map((item) => [item.id, all ? refundableOf(item) : 0])));

   const setLineQty = (item, value) =>
      setQty((prev) => ({ ...prev, [item.id]: Math.max(0, Math.min(refundableOf(item), value)) }));

   const selected = lines.filter((item) => (qty[item.id] ?? 0) > 0);
   const isEverythingLeft = lines.every((item) => (qty[item.id] ?? 0) === refundableOf(item));
   const nothingReturnedYet = (selectedOrder?.items || []).every((item) => !item.returned_quantity);
   const units = selected.reduce((s, item) => s + qty[item.id], 0);
   // Mirrors the server: a whole untouched sale refunds its exact total, otherwise lines at their sold price
   const amount =
      isEverythingLeft && nothingReturnedYet
         ? Number(selectedOrder?.order_total || 0)
         : selected.reduce((s, item) => s + describeOrderItem(item).price * qty[item.id], 0);

   const submit = (data) => {
      if (!selected.length) return;
      onConfirm({
         ...data,
         items: isEverythingLeft ? undefined : selected.map((item) => ({ order_item_id: item.id, quantity: qty[item.id] })),
      });
   };

   const renderStepper = (item, line) => {
      const max = refundableOf(item);
      const value = qty[item.id] ?? 0;
      return (
         <div className='flex shrink-0 flex-col items-end gap-1'>
            <div
               role='group'
               aria-label={`Quantity of ${line.label} to return`}
               className='flex h-8 items-stretch overflow-hidden rounded-lg border border-neutral-200 bg-white'
            >
               <button
                  type='button'
                  className={stepClass}
                  onClick={() => setLineQty(item, value - 1)}
                  disabled={value <= 0}
                  aria-label='One less'
               >
                  <Minus className='size-3.5' />
               </button>
               <input
                  className='w-10 border-x border-neutral-200 text-center text-sm font-semibold tabular-nums outline-none focus:bg-neutral-50'
                  inputMode='numeric'
                  value={value}
                  onChange={(e) => setLineQty(item, parseInt(e.target.value.replace(/\D/g, "") || "0", 10))}
                  aria-label='Quantity to return'
               />
               <button
                  type='button'
                  className={stepClass}
                  onClick={() => setLineQty(item, value + 1)}
                  disabled={value >= max}
                  aria-label='One more'
               >
                  <Plus className='size-3.5' />
               </button>
            </div>
            <span className='text-xs text-neutral-500 tabular-nums'>
               {max} of {item.quantity} refundable
            </span>
         </div>
      );
   };

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         size='xl'
         contentClassName='my-0'
         className='pb-0'
         secondaryAction={null}
         primaryAction={null}
         title={`Refund Order #${padwithZero(selectedOrder?.id)}`}
      >
         <div className='flex flex-col gap-4'>
            <OrderHeader order={selectedOrder} showStatus={false} />

            <Note icon={Info}>
               Returned items go back into stock and a refund record is created. The cash comes out of your open
               shift&apos;s drawer.
            </Note>

            <ScrollArea className='max-h-64'>
               <OrderLines
                  items={lines}
                  showKitContents={false}
                  renderSide={renderStepper}
                  label={
                     <span className='flex items-center gap-3'>
                        <span>Items to return</span>
                        <button type='button' onClick={() => setAll(true)} className='font-semibold text-primary hover:underline'>
                           All
                        </button>
                        <button
                           type='button'
                           onClick={() => setAll(false)}
                           className='font-semibold text-neutral-500 hover:text-foreground hover:underline'
                        >
                           None
                        </button>
                     </span>
                  }
               />
            </ScrollArea>

            <div className='flex items-center justify-between gap-3 rounded-xl border border-neutral-200 px-4 py-3'>
               <div className='flex flex-col gap-0.5'>
                  <p className='text-sm font-semibold text-foreground'>Refund amount</p>
                  <p className='text-xs text-neutral-500 tabular-nums'>
                     {units} item{units === 1 ? "" : "s"}
                     {isEverythingLeft ? (nothingReturnedYet ? " · whole order" : " · everything left") : " · partial"}
                  </p>
               </div>
               <p className='text-xl font-bold text-foreground tabular-nums'>{priceParser(amount)}</p>
            </div>
         </div>

         <Form
            className='mt-4 flex flex-col'
            onSubmit={submit}
            schema={refundOrderSchema}
            defaultValues={{
               ...refundOrderDefaultValues,
               id: selectedOrder?.id || null,
            }}
         >
            {(form) => {
               // form.watch() re-renders the form host on change; a hook here would break hook rules
               const formValues = form.watch();

               return (
                  <>
                     <ISelect
                        showAll={false}
                        name='reason'
                        label='Reason'
                        placeholder='Select a reason'
                        options={REFUND_REASONS_OPTIONS}
                     />

                     {formValues.reason && formValues.reason === "Other" && (
                        <ITextarea
                           name='reason_details'
                           wrapperClassName='mt-4'
                           label='Details'
                           placeholder='e.g. Customer requested a refund due to...'
                        />
                     )}

                     <div className='-mx-3 mt-4 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 py-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                        <IButtonConfirm
                           title='Cancel this refund?'
                           message='Nothing will be refunded.'
                           cancelLabel='Keep editing'
                           confirmLabel='Cancel refund'
                           asButton
                           onConfirm={onClose}
                        >
                           Cancel
                        </IButtonConfirm>
                        <IButton type='submit' variant='default' disabled={!selected.length}>
                           Refund {priceParser(amount)}
                        </IButton>
                     </div>
                  </>
               );
            }}
         </Form>
      </Modal>
   );
}
