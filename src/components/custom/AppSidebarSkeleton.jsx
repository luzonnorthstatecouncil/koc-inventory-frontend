import { Sidebar } from "@/components/ui/sidebar";
import LogoWordmark from "@/assets/images/logos/logo_wordmark_white.png";

export function AppSidebarSkeleton() {
   return (
      <Sidebar className='bg-sidebar'>
         <div className='flex h-full flex-col bg-sidebar px-3 pt-5 pb-4' aria-hidden='true'>
            <img src={LogoWordmark} alt='' className='-mt-2 mb-4 ml-0.5 h-16 w-auto self-start' />
            {[2, 6, 3].map((count, group) => (
               <div key={group} className='flex flex-col gap-0.5 pb-5'>
                  <div className='mx-3 mb-2 h-3.5 w-16 rounded bg-white/10' />
                  {Array.from({ length: count }).map((_, i) => (
                     <div key={i} className='flex h-10 items-center gap-3 px-3'>
                        <div className='size-5 rounded bg-white/8' />
                        <div className='h-4 w-28 rounded bg-white/8' />
                     </div>
                  ))}
               </div>
            ))}
         </div>
      </Sidebar>
   );
}
