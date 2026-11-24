/**
 * Normalizes an order line from the API, which is either a product variant
 * (item.product) or a kit (item.kit), into display fields.
 */
export const describeOrderItem = (item) => {
   if (item?.kit_id) {
      return {
         isKit: true,
         name: item.kit?.name || "Unknown Kit",
         variantName: "",
         label: item.kit?.name || "Unknown Kit",
         price: item.kit?.price ?? 0,
      };
   }

   const name = item?.product?.inventory?.name || "Unknown Item";
   const variantName = item?.product?.variant_name || "";

   return {
      isKit: false,
      name,
      variantName,
      label: variantName ? `${name} - ${variantName}` : name,
      price: item?.product?.inventory?.price ?? 0,
   };
};
