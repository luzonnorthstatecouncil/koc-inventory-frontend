import Paragraph from "@/components/custom/Paragraph";
import ModalSkeleton from "@/components/custom/ModalSkeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Box, Layers, Tag, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function View({ item, isLoading }) {
   if (isLoading || !item) {
      return <ModalSkeleton />;
   }

   const isOut = item.availability === 0;
   const isLow = item.availability <= 5;

   return (
      <div className='space-y-6 py-2'>
         <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-4'>
               <div className='flex items-start gap-3'>
                  <div className='p-2 rounded-lg bg-primary/10 text-primary'>
                     <Box className='size-5' />
                  </div>
                  <div>
                     <Paragraph
                        size='xs'
                        className='text-muted-foreground uppercase tracking-wider font-semibold'
                     >
                        Kit Name
                     </Paragraph>
                     <p className='text-lg font-bold text-foreground'>{item.name}</p>
                  </div>
               </div>

               <div className='flex items-start gap-3'>
                  <div className='p-2 rounded-lg bg-blue-100 text-blue-600'>
                     <Tag className='size-5' />
                  </div>
                  <div>
                     <Paragraph
                        size='xs'
                        className='text-muted-foreground uppercase tracking-wider font-semibold'
                     >
                        SKU
                     </Paragraph>
                     <p className='text-sm font-mono font-medium'>{item.sku}</p>
                  </div>
               </div>

               <div className='flex items-start gap-3'>
                  <div className='p-2 rounded-lg bg-purple-100 text-purple-600'>
                     <Layers className='size-5' />
                  </div>
                  <div>
                     <Paragraph
                        size='xs'
                        className='text-muted-foreground uppercase tracking-wider font-semibold'
                     >
                        Category
                     </Paragraph>
                     <p className='text-sm font-medium'>{item.category?.name || "Uncategorized"}</p>
                  </div>
               </div>
            </div>

            <div className='space-y-4'>
               <div className='flex items-start gap-3'>
                  <div className='p-2 rounded-lg bg-emerald-100 text-emerald-600'>
                     <DollarSign className='size-5' />
                  </div>
                  <div>
                     <Paragraph
                        size='xs'
                        className='text-muted-foreground uppercase tracking-wider font-semibold'
                     >
                        Price
                     </Paragraph>
                     <p className='text-lg font-bold text-foreground'>
                        PHP{" "}
                        {parseFloat(item.price || 0).toLocaleString("en-PH", {
                           minimumFractionDigits: 2,
                        })}
                     </p>
                  </div>
               </div>

               <div className='flex items-start gap-3'>
                  <div className='p-2 rounded-lg bg-amber-100 text-amber-600'>
                     <Activity className='size-5' />
                  </div>
                  <div>
                     <Paragraph
                        size='xs'
                        className='text-muted-foreground uppercase tracking-wider font-semibold'
                     >
                        Status
                     </Paragraph>
                     <Badge
                        className={cn(
                           "mt-0.5 capitalize",
                           item.status === "active"
                              ? "bg-emerald-500 hover:bg-emerald-600"
                              : "bg-gray-500 hover:bg-gray-600",
                        )}
                     >
                        {item.status}
                     </Badge>
                  </div>
               </div>

               <div className='flex items-start gap-3'>
                  <div className='p-2 rounded-lg bg-indigo-100 text-indigo-600'>
                     <Box className='size-5' />
                  </div>
                  <div>
                     <Paragraph
                        size='xs'
                        className='text-muted-foreground uppercase tracking-wider font-semibold'
                     >
                        Locked Qty
                     </Paragraph>
                     <p className='text-sm font-bold'>{item.locked_qty || 0} pre-assembled</p>
                  </div>
               </div>
            </div>
         </div>

         <Separator />

         <div className='space-y-4'>
            <div className='flex items-center justify-between'>
               <div className='flex items-center gap-2'>
                  <Layers className='size-5 text-primary' />
                  <h3 className='font-semibold'>Kit Components</h3>
               </div>
               <div className='text-right'>
                  <Paragraph
                     size='xs'
                     className='text-muted-foreground uppercase tracking-wider font-semibold'
                  >
                     Total Availability
                  </Paragraph>
                  <div className='flex items-baseline justify-end gap-2'>
                     <p
                        className={cn(
                           "text-xl font-black tabular-nums",
                           isOut ? "text-red-600" : isLow ? "text-amber-600" : "text-emerald-600",
                        )}
                     >
                        {item.availability}
                     </p>
                     <span className='text-sm font-normal text-muted-foreground'>kits</span>
                  </div>
                  {item.locked_qty > 0 && (
                     <p className='text-[10px] text-muted-foreground'>
                        ({item.locked_qty} locked + {item.availability - item.locked_qty} potential)
                     </p>
                  )}
               </div>
            </div>

            <div className='grid grid-cols-1 gap-3'>
               {item.items?.map((ki) => (
                  <div
                     key={ki.id}
                     className='flex items-center justify-between p-4 rounded-xl border bg-accent/5'
                  >
                     <div className='space-y-1'>
                        <p className='font-semibold text-sm'>{ki.variant?.inventory?.name}</p>
                        <p className='text-xs text-muted-foreground flex gap-2 items-center'>
                           <span className='px-1.5 py-0.5 rounded bg-white border'>
                              {ki.variant?.name || "Standard"}
                           </span>
                           <span>•</span>
                           <span>Current Stock: {ki.variant?.current_qty}</span>
                        </p>
                     </div>
                     <div className='text-right'>
                        <p className='text-xs text-muted-foreground font-medium'>Required</p>
                        <p className='text-lg font-bold text-primary'>x{ki.quantity}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}
