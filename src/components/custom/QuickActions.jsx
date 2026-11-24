import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import Modal from "@/components/custom/Modal";
import IButton from "@/components/custom/Button";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import Create from "@/components/modals/inventory-stock/Create";
import { useGetInventoryAsOptionsQuery } from "@/features/api/inventory";
import { useEditKitMutation, useGetKitByIdQuery, useGetKitCapacityQuery } from "@/features/api/kit";
import { closeAddStock, closeAssembleKit } from "@/features/slice/quickActionsSlice";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { cn } from "@/lib/utils";

/** Add stock, opened from a shortage elsewhere with the item, quantity and supplier filled in. */
function QuickAddStock({ prefill, onClose }) {
   const { data: inventoryOptions, isLoading, isFetching } = useGetInventoryAsOptionsQuery({}, { refetchOnMountOrArgChange: true });

   // Keep the suggestion within the room left below the item's max level
   const safePrefill = useMemo(() => {
      if (!prefill || !inventoryOptions) return prefill;
      const option = inventoryOptions.find((o) => o.id == prefill.variantId);
      if (!option || !prefill.quantity) return prefill;
      const room = Math.max(Number(option.max_qty_level || 0) - Number(option.current_qty || 0), 0);
      return { ...prefill, quantity: room > 0 ? Math.min(prefill.quantity, room) : prefill.quantity };
   }, [prefill, inventoryOptions]);

   return (
      <Modal
         size='5xl'
         isOpen
         onClose={onClose}
         title='Add stock'
         description='Record a batch received from a supplier.'
         secondaryAction={null}
         contentClassName='my-0'
         className='gap-4 pb-0'
         primaryAction={null}
         isLoading={isLoading || isFetching}
      >
         {inventoryOptions && <Create onClose={onClose} inventoryOptions={inventoryOptions} prefill={safePrefill} />}
      </Modal>
   );
}

/** Raise a kit's pre-assembled count, capped by what the component stock allows. */
function AssembleKit({ kitId, onClose }) {
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const [editKit, { isLoading: saving }] = useEditKitMutation();
   const { data: kit, isLoading } = useGetKitByIdQuery(kitId, { refetchOnMountOrArgChange: true });

   const items = useMemo(
      () => (kit?.items ?? []).map((ki) => ({ variant_id: Number(ki.variant_id), quantity: Number(ki.quantity) })),
      [kit],
   );
   const { data: capacity, isFetching: checking } = useGetKitCapacityQuery(
      { kit_id: kitId, items },
      { skip: !kit || items.length === 0, refetchOnMountOrArgChange: true },
   );

   const current = Number(kit?.locked_qty) || 0;
   // capacity.max is the total that can be locked (this kit's own reservation already released)
   const maxMore = capacity ? Math.max(Number(capacity.max) - current, 0) : 0;
   const [more, setMore] = useState("");
   const amount = Number.parseInt(more, 10);
   const valid = Number.isInteger(amount) && amount > 0 && amount <= maxMore;

   const submit = async (e) => {
      e.preventDefault();
      if (!valid) return;
      const confirmed = await confirm({
         title: "Assemble more kits?",
         message: `${kit.name} goes from ${current} to ${current + amount} pre-assembled. Their component stock is reserved now.`,
      });
      if (!confirmed) return;
      const { success, message } = await exec(editKit, { id: kitId, locked_qty: current + amount });
      if (!success) {
         toast.error(message);
         return;
      }
      toast.success(message || "Kits assembled");
      onClose();
   };

   const limiting = capacity?.limiting;

   return (
      <Modal
         isOpen
         onClose={onClose}
         title='Assemble more'
         description='Put more kits together ahead of time.'
         secondaryAction={null}
         primaryAction={null}
         contentClassName='my-0'
         className='pb-0'
      >
         {isLoading || !kit ? (
            <ModalSkeleton />
         ) : (
            <form onSubmit={submit} className='flex flex-col gap-4'>
               <div className='flex items-start justify-between gap-4 rounded-xl border border-neutral-200 px-4 py-3'>
                  <div className='flex min-w-0 flex-col gap-0.5'>
                     <p className='truncate text-sm font-semibold text-foreground'>{kit.name}</p>
                     <p className='text-xs text-neutral-500 tabular-nums'>{kit.sku}</p>
                  </div>
                  <div className='flex shrink-0 flex-col items-end gap-0.5'>
                     <p className='text-base font-semibold text-foreground tabular-nums'>{current.toLocaleString()}</p>
                     <p className='text-xs text-neutral-500'>pre-assembled now</p>
                  </div>
               </div>

               <label className='flex flex-col gap-1.5'>
                  <span className='text-sm font-medium text-foreground'>How many more?</span>
                  <input
                     autoFocus
                     inputMode='numeric'
                     value={more}
                     onChange={(e) => setMore(e.target.value.replace(/\D/g, ""))}
                     placeholder='0'
                     disabled={!capacity || maxMore === 0}
                     className='h-11 w-full rounded-lg border border-neutral-200 bg-white px-3 text-base tabular-nums outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgb(17_40_102/0.12)] disabled:bg-neutral-50'
                  />
                  <span
                     className={cn(
                        "text-xs",
                        !capacity ? "text-neutral-500" : maxMore === 0 || (more && !valid) ? "text-red-700" : "text-neutral-500",
                        checking && "opacity-60",
                     )}
                     aria-live='polite'
                  >
                     {!capacity
                        ? "Checking component stock…"
                        : maxMore === 0
                          ? "Not enough component stock to assemble more."
                          : `Up to ${maxMore.toLocaleString()} more with the stock available.`}
                     {limiting && (maxMore === 0 || (more && !valid)) && (
                        <span className='block text-neutral-500'>
                           Limited by {limiting.name}: {limiting.available} available, {limiting.per_kit} per kit.
                        </span>
                     )}
                  </span>
               </label>

               {maxMore > 0 && (
                  <div className='flex flex-wrap gap-1.5' aria-label='Quick amounts'>
                     {[...new Set([1, 5, 10, maxMore])]
                        .filter((n) => n <= maxMore)
                        .map((n) => (
                           <button
                              key={n}
                              type='button'
                              onClick={() => setMore(String(n))}
                              className={cn(
                                 "h-8 rounded-full border px-3 text-sm font-medium tabular-nums transition-colors",
                                 amount === n
                                    ? "border-primary bg-primary text-white"
                                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400",
                              )}
                           >
                              {n === maxMore && n > 10 ? `Max (${n})` : `+${n}`}
                           </button>
                        ))}
                  </div>
               )}

               <footer className='-mx-3 mt-1 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                  <IButton type='button' variant='outline' onClick={onClose}>
                     Cancel
                  </IButton>
                  <IButton type='submit' disabled={!valid || saving} loading={saving}>
                     {valid ? `Assemble ${amount}` : "Assemble"}
                  </IButton>
               </footer>
            </form>
         )}
      </Modal>
   );
}

/** Mounted once (in the page layout); opens whichever shortcut a page asked for. */
export default function QuickActions() {
   const dispatch = useDispatch();
   const { addStock, assembleKit } = useSelector((state) => state.quickActions);

   return (
      <>
         {addStock && <QuickAddStock prefill={addStock} onClose={() => dispatch(closeAddStock())} />}
         {assembleKit && <AssembleKit kitId={assembleKit.kitId} onClose={() => dispatch(closeAssembleKit())} />}
      </>
   );
}
