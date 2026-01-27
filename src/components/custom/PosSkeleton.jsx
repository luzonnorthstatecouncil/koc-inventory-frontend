import { Skeleton } from "../ui/skeleton";

const PosSkeletonItem = () => (
   <div className='space-y-2 max-w-60'>
      <Skeleton className='w-60 h-4 bg-accent' />
      <Skeleton className='w-48 h-4 bg-accent' />
      <Skeleton className='w-56 h-2 bg-accent' />
      <Skeleton className='w-32 h-4 bg-accent' />
      <Skeleton className='w-60 h-8 bg-accent' />
   </div>
);

export default function PosSkeleton() {
   return (
      <>
         <PosSkeletonItem />
         <PosSkeletonItem />
         <PosSkeletonItem />
         <PosSkeletonItem />
      </>
   );
}
