import IButton from "@/components/custom/Button";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function BulkImportFailures({ data, onClose }) {
   const { failed = [], summary = {} } = data ?? {};

   return (
      <div className='flex flex-col gap-4'>
         {/* Summary */}
         <div className='grid grid-cols-3 gap-3'>
            <div className='flex flex-col items-center justify-center rounded-lg border p-3 text-center'>
               <Paragraph size='sm' variant='muted'>
                  Total
               </Paragraph>
               <Title size='2xl' className='font-extrabold'>
                  {summary.total ?? 0}
               </Title>
            </div>
            <div className='flex flex-col items-center justify-center rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-900 dark:bg-green-950'>
               <Paragraph size='sm' variant='muted'>
                  Successful
               </Paragraph>
               <Title size='2xl' className='font-extrabold text-green-600 dark:text-green-400'>
                  {summary.successful ?? 0}
               </Title>
            </div>
            <div className='flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-900 dark:bg-red-950'>
               <Paragraph size='sm' variant='muted'>
                  Failed
               </Paragraph>
               <Title size='2xl' className='font-extrabold text-red-600 dark:text-red-400'>
                  {summary.failed ?? 0}
               </Title>
            </div>
         </div>

         {/* Failed rows */}
         {failed.length > 0 && (
            <div className='flex flex-col gap-2'>
               <Title size='sm' className='font-semibold'>
                  Failed Entries
               </Title>
               <div className='flex flex-col gap-2 max-h-72 overflow-y-auto pr-1'>
                  {failed.map((item, index) => (
                     <div
                        key={index}
                        className='flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950'
                     >
                        <AlertCircle className='mt-0.5 h-4 w-4 shrink-0 text-red-500' />
                        <div className='flex flex-col gap-0.5 min-w-0'>
                           <div className='flex items-center gap-2 flex-wrap'>
                              {item.row != null && (
                                 <Paragraph size='sm' className='font-medium'>
                                    Row {item.row}
                                 </Paragraph>
                              )}
                              {item.row != null && item.sku && <span className='text-muted-foreground text-xs'>•</span>}
                              {item.sku && (
                                 <Paragraph size='sm' className='font-mono text-xs'>
                                    {item.sku}
                                 </Paragraph>
                              )}
                              {item.variant_name && (
                                 <>
                                    <span className='text-muted-foreground text-xs'>•</span>
                                    <Paragraph size='sm' variant='muted' className='truncate'>
                                       {item.item_name || item.variant_name}
                                    </Paragraph>
                                 </>
                              )}
                           </div>
                           <Paragraph size='sm' className='text-red-600 dark:text-red-400'>
                              {item.error}
                           </Paragraph>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {failed.length === 0 && (
            <div className='flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950'>
               <CheckCircle2 className='h-5 w-5 shrink-0 text-green-500' />
               <Paragraph size='sm' className='text-green-700 dark:text-green-300'>
                  All entries were imported successfully.
               </Paragraph>
            </div>
         )}

         <div className='flex justify-end'>
            <IButton type='button' variant='default' onClick={onClose}>
               Close
            </IButton>
         </div>
      </div>
   );
}
