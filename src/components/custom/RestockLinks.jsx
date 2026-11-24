import { useDispatch, useSelector } from "react-redux";
import { PackagePlus, Plus } from "lucide-react";
import { openAddStock, openAssembleKit } from "@/features/slice/quickActionsSlice";
import { restockPrefill } from "@/helpers/restock";
import { cn } from "@/lib/utils";

const MANAGERS = ["admin", "supervisor"];

const linkClass =
   "inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/[0.07] focus-visible:outline-2 focus-visible:outline-primary";

const useRole = () => useSelector((state) => state.user.user?.role);

/**
 * "Add stock" next to a shortage: opens Add stock with the variant, a suggested quantity and
 * (when known) the supplier filled in. Supervisors see "Request stock" (theirs needs approval).
 */
export function AddStockLink({ variant, supplierId, quantity, className, variantLabel = false }) {
   const dispatch = useDispatch();
   const role = useRole();
   if (!MANAGERS.includes(role) || !variant) return null;

   const prefill = restockPrefill(variant, supplierId);
   if (quantity) prefill.quantity = quantity;
   const label = role === "supervisor" ? "Request stock" : "Add stock";

   return (
      <button
         type='button'
         className={cn(linkClass, className)}
         onClick={(e) => {
            e.stopPropagation();
            dispatch(openAddStock(prefill));
         }}
         title={variantLabel && variant.variant_name ? `${label} for ${variant.variant_name}` : undefined}
      >
         <Plus className='size-3.5' aria-hidden='true' />
         {label}
      </button>
   );
}

/** "Assemble more" next to a low kit: raises its pre-assembled count. Managers only, like editing a kit. */
export function AssembleKitLink({ kitId, className }) {
   const dispatch = useDispatch();
   const role = useRole();
   if (!MANAGERS.includes(role) || !kitId) return null;

   return (
      <button
         type='button'
         className={cn(linkClass, className)}
         onClick={(e) => {
            e.stopPropagation();
            dispatch(openAssembleKit({ kitId }));
         }}
      >
         <PackagePlus className='size-3.5' aria-hidden='true' />
         Assemble more
      </button>
   );
}
