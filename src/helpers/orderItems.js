/**
 * Normalizes an order line from the API into display fields. Lines store the name and
 * price they sold at (item_name, unit_price); the live product/kit is only a fallback.
 */
export const describeOrderItem = (item) => {
   // A line from a since-deleted kit has neither id; it has no variant_name, so it still reads right
   const isKit = Boolean(item?.kit_id) || (item?.product_id == null && item?.item_name != null);
   const soldPrice = item?.unit_price != null ? Number(item.unit_price) : null;

   if (isKit) {
      const name = item?.item_name || item?.kit?.name || "Unknown Kit";
      return { isKit: true, name, variantName: "", label: name, price: soldPrice ?? Number(item?.kit?.price ?? 0) };
   }

   const name = item?.item_name || item?.product?.inventory?.name || "Unknown Item";
   const variantName = item?.variant_name ?? item?.product?.variant_name ?? "";

   return {
      isKit: false,
      name,
      variantName,
      label: variantName ? `${name} - ${variantName}` : name,
      price: soldPrice ?? Number(item?.product?.inventory?.price ?? 0),
   };
};

/**
 * Receipt data for a saved order (fresh from checkout or from the order list),
 * in the shape InvoiceTemplate reads. Totals come from the order, not recomputed.
 */
export const orderToReceipt = (order) => {
   const payment = order?.payments ?? {};
   return {
      transactionData: {
         cart: (order?.items || []).map((orderItem) => {
            const line = describeOrderItem(orderItem);
            return {
               name: line.name,
               variant_option: line.isKit ? "Kit" : line.variantName,
               quantity: orderItem.quantity || 0,
               price: line.price,
            };
         }),
         paymentMethod: payment.payment_method || "N/A",
         subtotal: Number(order?.subtotal ?? order?.order_total ?? 0),
         total: Number(order?.order_total ?? 0),
         amountTendered: payment.amount_tendered ?? null,
         change: payment.change_given ?? 0,
         orderNumber: order?.order_number,
         invoiceNumber: order?.invoice_number || null,
         cashier: order?.user?.full_name || null,
      },
      transactionId: order?.order_number || order?.invoice_number || order?.id,
      timestamp: order?.created_at ? new Date(order.created_at) : new Date(),
   };
};
