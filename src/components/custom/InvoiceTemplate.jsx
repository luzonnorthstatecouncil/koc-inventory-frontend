import { priceParser } from "@/helpers/parser";
import LogoEmblem from "@/assets/images/logos/logo_emblem.png";

const InvoiceTemplate = ({ transactionData, transactionId, timestamp }) => {
   const { cart, paymentMethod, subtotal, total, amountTendered, change } = transactionData;

   const businessName = import.meta.env.VITE_BUSINESS_NAME || "YOUR BUSINESS NAME";
   const businessAddress = import.meta.env.VITE_BUSINESS_ADDRESS || "123 Business Street, City";
   const businessPhone = import.meta.env.VITE_BUSINESS_PHONE || "(123) 456-7890";
   const businessTIN = import.meta.env.VITE_BUSINESS_TIN || "000-000-000-000";

   return (
      <div className='w-full h-full bg-white p-8'>
         <style>
            {`
               @media print {
                  @page {
                     size: 80mm auto;
                     margin: 0;
                  }
                  body {
                     margin: 0;
                     padding: 0;
                  }
                  .print-invoice * {
                     color: black !important;
                  }
               }
            `}
         </style>

         <div className='print-invoice max-w-sm mx-auto font-mono text-sm'>
            {/* Header */}
            <div className='text-center mb-4'>
               <img src={LogoEmblem} alt='Logo' className='w-16 h-16 mx-auto mb-2' />
               <h1 className='text-xl font-bold'>{businessName}</h1>
               {/* <p className='text-xs'>{businessAddress}</p>
               <p className='text-xs'>Phone: {businessPhone}</p>
               <p className='text-xs'>TIN: {businessTIN}</p> */}
            </div>

            {/* Divider */}
            <div className='border-t-2 border-dashed border-gray-800 my-3'></div>

            {/* Transaction Info */}
            <div className='mb-3 text-xs'>
               <div className='flex justify-between'>
                  <span>Transaction ID:</span>
                  <span className='font-semibold uppercase'>#{transactionId || "N/A"}</span>
               </div>
               <div className='flex justify-between'>
                  <span>Date:</span>
                  <span>{new Date(timestamp).toLocaleDateString()}</span>
               </div>
               <div className='flex justify-between'>
                  <span>Time:</span>
                  <span>{new Date(timestamp).toLocaleTimeString()}</span>
               </div>
               {/* <div className='flex justify-between'>
                  <span>Cashier:</span>
                  <span>{localStorage.getItem("username") || "Admin"}</span>
               </div> */}
            </div>

            {/* Divider */}
            <div className='border-t-2 border-dashed border-gray-800 my-3'></div>

            {/* Items */}
            <div className='mb-3'>
               <table className='w-full text-xs'>
                  <thead>
                     <tr className='border-b border-gray-800'>
                        <th className='text-left py-1'>Item</th>
                        <th className='text-center py-1'>Qty</th>
                        <th className='text-right py-1'>Price</th>
                        <th className='text-right py-1'>Total</th>
                     </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-300'>
                     {cart.map((item, index) => (
                        <tr key={index}>
                           <td className='py-2 text-left'>
                              <div className='font-semibold'>{item.name}</div>
                              {item.variant_option && (
                                 <div className='text-xs text-gray-600'>{item.variant_option}</div>
                              )}
                           </td>
                           <td className='text-center'>{item.quantity || 0}</td>
                           <td className='text-right'>{priceParser(item.price || 0)}</td>
                           <td className='text-right font-semibold'>
                              {priceParser(((item.price || 0) * (item.quantity || 0)).toFixed(2))}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            {/* Divider */}
            <div className='border-t-2 border-dashed border-gray-800 my-3'></div>

            {/* Totals */}
            <div className='mb-3 text-xs space-y-1'>
               <div className='flex justify-between'>
                  <span>Subtotal:</span>
                  <span>{priceParser(Number(subtotal || 0).toFixed(2))}</span>
               </div>
               <div className='flex justify-between text-lg font-bold border-t border-gray-800 pt-1 mt-2'>
                  <span>TOTAL:</span>
                  <span>{priceParser(Number(total || 0).toFixed(2))}</span>
               </div>
            </div>

            {/* Payment Details */}
            <div className='mb-3 text-xs space-y-1'>
               <div className='flex justify-between'>
                  <span>Payment Method:</span>
                  <span className='font-semibold uppercase'>{paymentMethod}</span>
               </div>
               {amountTendered && (
                  <>
                     <div className='flex justify-between'>
                        <span>Amount Tendered:</span>
                        <span>{priceParser(Number(amountTendered).toFixed(2))}</span>
                     </div>
                     <div className='flex justify-between'>
                        <span>Change:</span>
                        <span className='font-semibold'>{priceParser(Number(change).toFixed(2))}</span>
                     </div>
                  </>
               )}
            </div>

            {/* Divider */}
            <div className='border-t-2 border-dashed border-gray-800 my-3'></div>

            {/* Footer */}
            <div className='text-center text-xs'>
               <p className='font-semibold mb-2'>THANK YOU FOR YOUR PURCHASE!</p>
               <p>This is not an official receipt.</p>
               <p className='mt-2'>For inquiries or concerns, please contact us.</p>
               <p className='mt-3 text-xs'>{businessName}</p>
            </div>
         </div>
      </div>
   );
};

InvoiceTemplate.displayName = "InvoiceTemplate";

export default InvoiceTemplate;
