import LogoWordmark from "@/assets/images/logos/logo_wordmark.png";
import EmptyLayout from "@/layout/EmptyLayout";

export default function LoadingState() {
   return (
      <EmptyLayout>
         <div className='relative flex flex-col items-center gap-6'>
            <img src={LogoWordmark} alt='Brand' className='w-60 lg:w-100 object-contain animate-pulse' />
         </div>
      </EmptyLayout>
   );
}
