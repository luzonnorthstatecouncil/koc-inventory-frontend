import Sidebar from "@/components/custom/Sidebar";
import BaseLayout from "./BaseLayout";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/AppSidebar";
import { AppSidebarSkeleton } from "@/components/custom/AppSidebarSkeleton";
import { Toaster } from "@/components/ui/sonner";
import { IBreadcrumb } from "@/components/custom/Breadcrumb";
import Title from "@/components/custom/Title";
import { useUser } from "@/hooks/useUser";
import { Menu } from "lucide-react";
import Logo from "@/assets/images/logos/logo_emblem.png";
import PageTransition from "@/components/custom/PageTransition";
import LoadingState from "@/components/custom/LoadingState";
import EmptyLayout from "./EmptyLayout";

export default function PageLayout({ children, pageTitle, breadcrumbItems, route }) {
   const user = useUser();

   return (
      <SidebarProvider>
         {!user?.role ? <AppSidebarSkeleton /> : <AppSidebar user={user} />}
         <BaseLayout className='flex-col w-full max-md:pt-16'>
            {/* Mobile Header with Sidebar Trigger */}
            <header className='flex items-center justify-center gap-3 md:hidden w-full fixed top-0 left-0 bg-primary mb-2 p-2 z-10'>
               <SidebarTrigger className='text-white'>
                  <Menu />
               </SidebarTrigger>

               <img src={Logo} alt='Logo' className='h-10 w-auto mx-auto -translate-x-1/2' />
            </header>

            {/* {breadcrumbItems && <IBreadcrumb items={breadcrumbItems} />} */}
            {pageTitle && <h1 className='text-base md:text-3xl font-bold sm:mb-2 md:mb-4 lg:mb-0'>{pageTitle}</h1>}

            <PageTransition>
               {!user?.role ? (
                  <LoadingState />
               ) : !route?.roles.includes(user?.role) && user ? (
                  <EmptyLayout>
                     <Title className='mb-12'>You do not have permission to view this page.</Title>
                  </EmptyLayout>
               ) : route?.disabled ? (
                  <EmptyLayout>
                     <Title className='mb-12'>This page is under development.</Title>
                  </EmptyLayout>
               ) : (
                  children
               )}
            </PageTransition>
         </BaseLayout>
      </SidebarProvider>
   );
}
