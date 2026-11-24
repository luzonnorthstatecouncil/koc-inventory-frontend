/**
 * Restock suggestions, shared by the quick "Add stock" shortcuts.
 * The quantity matches the Reorder report's formula (safe level + 5 − on hand).
 */

const num = (v) => Number(v) || 0;

/** True when a variant is below its safe level (low, reorder or out). */
export const needsRestock = (variant) => num(variant?.current_qty) < num(variant?.safe_qty_level);

/** How many to add to get back above the safe level; at least 1. */
export const suggestedRestockQty = (variant) =>
   Math.max(1, num(variant?.safe_qty_level) + 5 - num(variant?.current_qty));

/** The variant that most needs stock: out first, then the furthest below its reorder / safe level. */
export function mostUrgentVariant(variants = []) {
   const candidates = variants.filter(needsRestock);
   if (!candidates.length) return null;
   const urgency = (v) => {
      const qty = num(v.current_qty);
      if (qty <= 0) return Number.POSITIVE_INFINITY;
      return (num(v.safe_qty_level) - qty) / Math.max(num(v.safe_qty_level), 1);
   };
   return candidates.reduce((best, v) => (urgency(v) > urgency(best) ? v : best));
}

/** Prefill for the Add stock popup from a variant (and an optional known supplier). */
export const restockPrefill = (variant, supplierId) =>
   variant
      ? {
           variantId: variant.id ?? variant.variant_id,
           quantity: suggestedRestockQty(variant),
           supplierId: supplierId ?? null,
        }
      : null;
