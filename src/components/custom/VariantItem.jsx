import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Package } from "lucide-react";

const ZONES = [
   {
      key: "danger",
      label: "Critical",
      color: "bg-red-500",
      text: "text-red-600",
      border: "border-red-200",
      badge: "bg-red-50 text-red-700 ring-red-200",
   },
   {
      key: "warning",
      label: "Low",
      color: "bg-orange-400",
      text: "text-orange-600",
      border: "border-orange-200",
      badge: "bg-orange-50 text-orange-700 ring-orange-200",
   },
   {
      key: "safe",
      label: "Healthy",
      color: "bg-emerald-500",
      text: "text-emerald-600",
      border: "border-emerald-200",
      badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
   },
   {
      key: "over",
      label: "Overstocked",
      color: "bg-blue-500",
      text: "text-blue-600",
      border: "border-blue-200",
      badge: "bg-blue-50 text-blue-700 ring-blue-200",
   },
];

function getStockZone(current, reorder, safe, max) {
   if (current <= reorder) return ZONES[0];
   if (current < safe) return ZONES[1];
   if (current <= max) return ZONES[2];
   return ZONES[3];
}

function StockRangeBar({ current, reorder, safe, max }) {
   const ceiling = Math.max(max, current) * 1.1 || 100;
   const pct = (v) => `${Math.min((v / ceiling) * 100, 100).toFixed(1)}%`;

   const reorderPct = (reorder / ceiling) * 100;
   const safePct = (safe / ceiling) * 100;
   const maxPct = (max / ceiling) * 100;
   const currentPct = Math.min((current / ceiling) * 100, 100);

   return (
      <div className='relative h-5 rounded-full overflow-visible bg-gray-100 mt-1'>
         {/* Zone fills */}
         <div className='absolute inset-0 rounded-full overflow-hidden flex'>
            <div className='h-full bg-red-400/30' style={{ width: pct(reorder) }} />
            <div className='h-full bg-orange-300/30' style={{ width: `${safePct - reorderPct}%` }} />
            <div className='h-full bg-emerald-400/30' style={{ width: `${maxPct - safePct}%` }} />
            <div className='h-full bg-blue-300/30' style={{ flex: 1 }} />
         </div>

         {/* Threshold markers */}
         {[
            { pos: reorderPct, color: "bg-red-400", label: reorder },
            { pos: safePct, color: "bg-orange-400", label: safe },
            { pos: maxPct, color: "bg-emerald-500", label: max },
         ].map(({ pos, color, label }) => (
            <div key={label} className='absolute top-0 h-full flex flex-col items-center' style={{ left: `${pos}%` }}>
               <div className={cn("w-px h-full opacity-60", color)} />
            </div>
         ))}

         {/* Current stock needle */}
         <div
            className='absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-4 rounded-full bg-white border-2 border-gray-700 shadow-md z-10 transition-all duration-500'
            style={{ left: `${currentPct}%` }}
         />
      </div>
   );
}

export default function VariantItem({ variant }) {
   const {
      current_qty: current = 0,
      reorder_level: reorder = 0,
      safe_qty_level: safe = 0,
      max_qty_level: max = 0,
   } = variant;
   const zone = getStockZone(current, reorder, safe, max);

   return (
      <div
         className={cn(
            "group relative rounded-xl border bg-white p-4 transition-all duration-200 hover:shadow-md mb-2",
            zone.border,
         )}
      >
         {/* Header */}
         <div className='flex items-start justify-between mb-3'>
            <div className='flex items-center gap-2 min-w-0'>
               <div
                  className={cn(
                     "flex-shrink-0 p-1.5 rounded-lg",
                     zone.badge.split(" ").slice(0, 1).join(" ") + " bg-opacity-50",
                  )}
               >
                  <Package className={cn("size-4", zone.text)} />
               </div>
               <span className='font-semibold text-sm text-foreground truncate'>{variant.variant_name}</span>
            </div>

            <div className='flex items-center gap-1.5 flex-shrink-0 ml-2'>
               {zone.key === "danger" || zone.key === "warning" ? (
                  <AlertTriangle className={cn("size-3.5", zone.text)} />
               ) : (
                  <CheckCircle2 className={cn("size-3.5", zone.text)} />
               )}
               <span className={cn("text-xs font-semibold ring-1 ring-inset px-2 py-0.5 rounded-full", zone.badge)}>
                  {zone.label}
               </span>
            </div>
         </div>

         {/* SKU */}
         {variant.sku && <p className='text-xs text-muted-foreground mb-3 font-mono tracking-wide'>{variant.sku}</p>}

         {/* Current stock large display */}
         <div className='flex items-baseline gap-1 mb-3'>
            <span className={cn("text-3xl font-bold tabular-nums leading-none", zone.text)}>{current}</span>
            <span className='text-xs text-muted-foreground font-medium'>units in stock</span>
         </div>

         {/* Range bar */}
         <StockRangeBar current={current} reorder={reorder} safe={safe} max={max} />

         {/* Threshold legend */}
         <div className='flex justify-between mt-2 text-xs text-muted-foreground'>
            <span className='flex items-center gap-1'>
               <span className='inline-block size-1.5 rounded-full bg-red-400' />
               Reorder <span className='font-semibold text-foreground'>{reorder}</span>
            </span>
            <span className='flex items-center gap-1'>
               <span className='inline-block size-1.5 rounded-full bg-orange-400' />
               Safe <span className='font-semibold text-foreground'>{safe}</span>
            </span>
            <span className='flex items-center gap-1'>
               <span className='inline-block size-1.5 rounded-full bg-emerald-500' />
               Max <span className='font-semibold text-foreground'>{max}</span>
            </span>
         </div>
      </div>
   );
}
