import Sidebar from "@/components/custom/Sidebar";
import BaseLayout from "./BaseLayout";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/AppSidebar";
import { AppSidebarSkeleton } from "@/components/custom/AppSidebarSkeleton";
import Title from "@/components/custom/Title";
import { useUser } from "@/hooks/useUser";
import { Menu } from "lucide-react";
import Logo from "@/assets/images/logos/logo_emblem.png";
import LogoWordmark from "@/assets/images/logos/logo_wordmark_white.png";
import PageTransition from "@/components/custom/PageTransition";
import LoadingState from "@/components/custom/LoadingState";
import EmptyLayout from "./EmptyLayout";
import { useLocation } from "react-router-dom";
import Paragraph from "@/components/custom/Paragraph";

export default function PageLayout({ children, pageTitle, pageDescription, route }) {
   const user = useUser();
   const location = useLocation();
   const isSales = location.pathname?.includes("/sales");

   return (
      <SidebarProvider>
         {!user?.role ? <AppSidebarSkeleton /> : <AppSidebar user={user} />}

         <BaseLayout className={`flex-col w-full max-md:pt-16! max-lg:pt-18! ${isSales && "lg:mt-0 lg:pr-0 lg:py-0"}`}>
            {/* Mobile/Tablet Header with Sidebar Trigger */}
            <header className='flex items-center justify-center gap-3 lg:hidden w-full fixed top-0 left-0 bg-primary mb-2 p-2 md:py-0 md:px-4 z-10'>
               <SidebarTrigger className='text-white'>
                  <Menu />
               </SidebarTrigger>

               <img src={Logo} alt='Logo' className='h-10 w-auto mx-auto -translate-x-1/2 block md:hidden' />
               <img
                  src={LogoWordmark}
                  alt='Logo Wordmark'
                  className='h-16 w-auto mx-auto -translate-x-2 hidden md:block'
               />
            </header>

            {/* {breadcrumbItems && <IBreadcrumb items={breadcrumbItems} />} */}
            {pageTitle && <Title className='text-base md:text-3xl font-bold sm:mb-2 md:mb-0'>{pageTitle}</Title>}

            {pageDescription && <Paragraph className='text-sm md:text-base! text-muted-foreground mb-2'>{pageDescription}</Paragraph>}

            <PageTransition>
               {!user?.role ? (
                  <LoadingState />
               ) : route?.roles && !route?.roles.includes(user?.role) && user ? (
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
