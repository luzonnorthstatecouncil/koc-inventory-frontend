import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder for a page whose code is still downloading. The sidebar stays; only the content area waits. */
export default function PageSkeleton() {
   return (
      <div className='flex w-full flex-col gap-4 lg:py-2' aria-busy='true' aria-label='Loading page'>
         <div className='flex flex-col gap-2'>
            <Skeleton className='h-8 w-56' />
            <Skeleton className='h-4 w-full max-w-xl' />
         </div>

         <div className='mt-2 flex flex-wrap items-center justify-between gap-3'>
            <Skeleton className='h-10 w-full max-w-sm' />
            <div className='flex gap-2'>
               <Skeleton className='h-10 w-28' />
               <Skeleton className='h-10 w-32' />
            </div>
         </div>

         <div className='overflow-hidden rounded-lg border'>
            <Skeleton className='h-11 w-full rounded-none' />
            {Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className='flex items-center gap-4 border-t px-4 py-3.5'>
                  <Skeleton className='h-4 w-1/4' />
                  <Skeleton className='h-4 w-1/5' />
                  <Skeleton className='h-4 w-1/6' />
                  <Skeleton className='ml-auto h-4 w-16' />
               </div>
            ))}
         </div>
      </div>
   );
}
