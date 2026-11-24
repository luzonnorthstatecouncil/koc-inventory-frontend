/**
 * Display state of an order from the API's `status` (completed | partially_refunded | refunded |
 * voided) and whether it is a refund order (`refunded_order_id`). Colour only where staff need to
 * notice something; a normal completed sale stays neutral.
 */
export function orderStatus(order) {
   const isRefund = Boolean(order?.refunded_order_id);
   const status = order?.status ?? "completed";

   if (isRefund) {
      return status === "voided"
         ? { key: "refund_voided", label: "Refund voided", dot: "bg-neutral-300", text: "text-neutral-500" }
         : { key: "refund", label: "Refund", dot: "bg-red-500", text: "text-red-700" };
   }
   switch (status) {
      case "partially_refunded":
         return { key: status, label: "Partly refunded", dot: "bg-amber-500", text: "text-amber-700" };
      case "refunded":
         return { key: status, label: "Refunded", dot: "bg-red-500", text: "text-red-700" };
      case "voided":
         return { key: status, label: "Voided", dot: "bg-neutral-300", text: "text-neutral-500" };
      default:
         return { key: "completed", label: "Completed", dot: "bg-neutral-300", text: "text-neutral-700" };
   }
}

/** True for a sale that still has something left to refund. */
export const canRefund = (order) =>
   !order?.refunded_order_id && ["completed", "partially_refunded"].includes(order?.status ?? "completed");

/** True for a sale that can be voided (no refunds yet; the server also checks the shift is open). */
export const canVoidSale = (order) => !order?.refunded_order_id && (order?.status ?? "completed") === "completed";

/** True for a refund that can be voided. */
export const canVoidRefund = (order) => Boolean(order?.refunded_order_id) && order?.status !== "voided";
