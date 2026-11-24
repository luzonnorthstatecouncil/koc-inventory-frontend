import { Info, Layers, Plus } from "lucide-react";
import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import IPopover from "@/components/custom/Popover";

/** "Laptop - Default" → { title: "Laptop", variant: null }; "Polo - Medium" → { title: "Polo", variant: "Medium" } */
// eslint-disable-next-line react-refresh/only-export-components
export function splitItemName(name = "") {
   const at = name.lastIndexOf(" - ");
   if (at <= 0) return { title: name, variant: null };
   const variant = name.slice(at + 3);
   return { title: name.slice(0, at), variant: variant === "Default" ? null : variant };
}

/**
 * Stock state in words first; colour is reserved for the two states staff must act on.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function stockState(current, reorder, safe) {
   const n = Number(current) || 0;
   if (n <= 0) return { label: "Out of stock", tone: "out" };
   if (n < Number(reorder)) return { label: `${n} left · reorder`, tone: "critical" };
   if (n < Number(safe)) return { label: `${n} left · low`, tone: "low" };
   return { label: `${n} in stock`, tone: "ok" };
}

const toneText = {
   ok: "text-neutral-500",
   out: "text-neutral-500",
   low: "text-amber-700",
   critical: "text-red-700",
};

const toneFill = {
   ok: "bg-emerald-500",
   out: "bg-transparent",
   low: "bg-amber-500",
   critical: "bg-red-600",
};

function StockLine({ current, reorder, safe }) {
   const state = stockState(current, reorder, safe);
   // The POS list doesn't return a max level; twice the safe level reads well as "full".
   const max = Math.max(Number(safe) * 2 || 1, 1);
   const pct = (v) => `${Math.max(0, Math.min(100, ((Number(v) || 0) / max) * 100))}%`;

   return (
      <div className='flex items-center justify-between gap-2 border-t border-neutral-100 pt-2.5'>
         <span className={cn("flex min-w-0 items-center gap-1.5 whitespace-nowrap text-xs 2xl:text-sm font-medium tabular-nums", toneText[state.tone])}>
            <span
               aria-hidden='true'
               className={cn("size-1.5 shrink-0 rounded-full", state.tone === "out" ? "bg-neutral-300" : toneFill[state.tone])}
            />
            {state.label}
         </span>
         {state.tone !== "out" && (
            <span className='relative h-1 w-8 shrink-0 overflow-hidden 2xl:w-12 rounded-full bg-neutral-100' aria-hidden='true'>
               <span
                  className={cn("absolute inset-y-0 left-0 rounded-full", toneFill[state.tone], state.tone === "ok" && "opacity-70")}
                  style={{ width: pct(current) }}
               />
            </span>
         )}
      </div>
   );
}

function KitContents({ name, items }) {
   const { title } = splitItemName(name);
   const pieces = (items ?? []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

   return (
      <IPopover
         align='end'
         sideOffset={8}
         className='w-80 overflow-hidden rounded-xl border-neutral-200 p-0 shadow-[0_12px_32px_-12px_rgb(15_23_42/0.3)]'
         trigger={
            <button
               type='button'
               aria-label={`What's in ${name}`}
               className='absolute top-2.5 right-2.5 z-10 flex size-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary'
            >
               <Info className='size-4' />
            </button>
         }
      >
         <div className='flex items-start gap-3 border-b border-neutral-100 bg-neutral-50 px-4 py-3'>
            <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
               <Layers className='size-4' />
            </span>
            <div className='min-w-0'>
               <p className='truncate text-sm font-semibold text-foreground lg:text-base'>{title}</p>
               <p className='text-xs text-neutral-500 tabular-nums lg:text-sm'>
                  {items?.length
                     ? `${items.length} ${items.length === 1 ? "item" : "items"} · ${pieces} ${pieces === 1 ? "piece" : "pieces"}`
                     : "Kit contents"}
               </p>
            </div>
         </div>

         {items?.length ? (
            <ul className='max-h-64 divide-y divide-neutral-100 overflow-y-auto px-2 py-1.5'>
               {items.map((item) => {
                  const variantName = item.variant?.variant_name;
                  const showVariant = variantName && variantName !== "Default";
                  return (
                     <li key={item.id} className='flex items-center gap-3 px-2 py-2.5'>
                        <span className='flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white px-1.5 text-xs font-semibold text-foreground tabular-nums lg:text-sm'>
                           {item.quantity}×
                        </span>
                        <div className='min-w-0'>
                           <p className='truncate text-sm font-medium text-foreground lg:text-base'>
                              {item.variant?.inventory?.name || "Unknown item"}
                           </p>
                           {showVariant && <p className='truncate text-xs text-neutral-500 lg:text-sm'>{variantName}</p>}
                        </div>
                     </li>
                  );
               })}
            </ul>
         ) : (
            <p className='px-4 py-6 text-center text-sm text-neutral-500'>No items listed for this kit.</p>
         )}
      </IPopover>
   );
}

export default function PointOfSaleItem({
   name,
   sku,
   price,
   current_qty,
   reorder_level,
   safe_qty_level,
   isKit,
   items,
   cartQty = 0,
   onClick,
}) {
   const outOfStock = Number(current_qty) <= 0;
   const inCart = cartQty > 0;
   const atLimit = inCart && cartQty >= Number(current_qty);
   const { title, variant } = splitItemName(name);
   const amount = priceParser(price).replace(/^PHP\s*/, "");

   return (
      <div className='relative'>
         <button
            type='button'
            onClick={onClick}
            disabled={outOfStock}
            aria-label={`Add ${name}, ${priceParser(price)}${inCart ? `, ${cartQty} in sale` : ""}`}
            className={cn(
               "group flex h-full min-h-[152px] w-full flex-col rounded-xl border bg-white p-3.5 text-left",
               "transition-[border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.985]",
               "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
               inCart
                  ? "border-primary shadow-[0_0_0_1px_var(--primary),0_6px_16px_-8px_rgb(17_40_102/0.35)]"
                  : "border-neutral-200 hover:border-neutral-300 hover:shadow-[0_6px_16px_-10px_rgb(15_23_42/0.25)]",
               outOfStock && "cursor-not-allowed border-dashed bg-neutral-50 hover:border-neutral-200 hover:shadow-none active:scale-100",
               atLimit && "cursor-default active:scale-100",
            )}
         >
            <div className={cn("flex min-w-0 items-center gap-1.5", isKit && "pr-7", outOfStock && "opacity-60")}>
               {sku && (
                  <span className='truncate text-xs font-medium tracking-wide text-neutral-500 tabular-nums uppercase'>
                     {sku}
                  </span>
               )}
               {isKit && (
                  <span className='shrink-0 rounded-full bg-primary/[0.08] px-1.5 py-px text-xs font-bold tracking-wide text-primary uppercase'>
                     Kit
                  </span>
               )}
            </div>

            <div className={cn("mt-1.5 min-h-10", outOfStock && "opacity-60")}>
               <p className='line-clamp-2 text-sm lg:text-base leading-5 font-semibold text-foreground'>{title}</p>
               {variant && <p className='truncate text-xs lg:text-sm text-neutral-500'>{variant}</p>}
            </div>

            <div className='mt-auto flex items-end justify-between gap-2 pt-3 pb-3'>
               <p className={cn("flex min-w-0 flex-wrap items-baseline gap-x-1 tabular-nums", outOfStock && "opacity-60")}>
                  <span className='text-xs font-semibold text-neutral-500'>PHP</span>
                  <span className='text-lg lg:text-base 2xl:text-xl leading-none font-bold tracking-[-0.02em] text-foreground'>{amount}</span>
               </p>
               {!outOfStock &&
                  (inCart ? (
                     <span
                        className='flex h-7 min-w-7 shrink-0 items-center justify-center rounded-lg bg-primary px-2 text-xs lg:text-sm font-bold text-white tabular-nums'
                        title={atLimit ? "All stock is in this sale" : undefined}
                     >
                        ×{cartQty}
                     </span>
                  ) : (
                     <span
                        aria-hidden='true'
                        className='flex size-7 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors duration-150 group-hover:border-primary group-hover:bg-primary group-hover:text-white'
                     >
                        <Plus className='size-4' strokeWidth={2.25} />
                     </span>
                  ))}
            </div>

            <StockLine current={current_qty} reorder={reorder_level} safe={safe_qty_level} />
         </button>

         {isKit && <KitContents name={name} items={items} />}
      </div>
   );
}
