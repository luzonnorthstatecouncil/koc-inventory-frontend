import { ChevronRight, LogOutIcon, MoreHorizontal, User2 } from "lucide-react";

import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarGroup,
   SidebarGroupContent,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarMenuSub,
   SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import IDropdown from "./Dropdown";
import IButtonConfirm from "./ButtonConfirm";
import { useNavigate, useLocation } from "react-router-dom";
import { useLogout } from "@/hooks/useLogout";
import { ACCOUNT, MODULES } from "@/constants/routes";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "@/lib/utils";
import ITooltip from "./Tooltip";
import LogoWordmark from "@/assets/images/logos/logo_wordmark.png";

export function AppSidebar({ user }) {
   const navigate = useNavigate();
   const location = useLocation();
   const logout = useLogout();

   const onSignOut = async () => {
      await logout();
   };

   const FOOTER_ITEMS = [
      { label: "Account", icon: User2, onClick: () => navigate(ACCOUNT.path) },
      {
         className: "!text-destructive",
         label: (
            <IButtonConfirm
               className='!text-destructive text-start !w-full flex items-center gap-4'
               title='Sign Out'
               message='Are you sure you want to sign out?'
               onConfirm={onSignOut}
            >
               <LogOutIcon className='text-destructive' />
               Sign Out
            </IButtonConfirm>
         ),
      },
   ];

   return (
      <Sidebar className='border border-sidebar-border max-lg:w-2/6'>
         <SidebarContent className='p-1.5 sm:p-2 bg-sidebar border border-sidebar-border text-sidebar-foreground'>
            <SidebarGroup className='text-lg sm:text-xl md:text-2xl font-bold flex flex-row items-center gap-2 px-1 sm:px-0'>
               <img src={LogoWordmark} alt='Logo' className='w-3/4 sm:w-4/5' />
            </SidebarGroup>

            {MODULES.map((module, index) =>
               module.modules.some((item) => !item.roles || item.roles.includes(user.role)) ? (
                  <SidebarGroup key={index}>
                     <SidebarGroupLabel className='text-sidebar-foreground text-xs sm:text-sm'>
                        {module.title}
                     </SidebarGroupLabel>
                     <SidebarGroupContent>
                        <SidebarMenu className='gap-0 w-full'>
                           {module.modules.map((item) =>
                              item.roles && !item.roles.includes(user.role) ? null : item.children &&
                                item.children.length > 0 ? (
                                 <Collapsible
                                    key={item.title}
                                    className='group'
                                    asChild
                                    defaultOpen={location.pathname.includes("inventory")}
                                 >
                                    <SidebarMenuItem>
                                       <CollapsibleTrigger asChild>
                                          <SidebarMenuButton asChild>
                                             <div
                                                className={cn(
                                                   "flex items-center justify-between gap-2 sm:gap-3 w-full text-sidebar-foreground text-sm sm:text-base cursor-pointer select-none hover:bg-secondary/5! rounded hover:text-secondary! transition-all py-1",
                                                   location.pathname.includes("inventory") &&
                                                      "bg-secondary/5! font-semibold text-secondary!",
                                                )}
                                             >
                                                <div className='flex items-center gap-1.5 sm:gap-2 mx-1 sm:mx-1.5'>
                                                   <item.icon className='size-3.5 sm:size-4' />
                                                   <h1 className='text-xs sm:text-sm'>{item.title}</h1>
                                                </div>
                                                <ChevronRight className='size-3.5 sm:size-4 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-90' />
                                             </div>
                                          </SidebarMenuButton>
                                       </CollapsibleTrigger>

                                       <CollapsibleContent className='border-l border-gray-400' asChild>
                                          <SidebarMenuSub>
                                             {item.children.map((child) =>
                                                child.roles && !child.roles.includes(user.role) ? null : (
                                                   <SidebarMenuSubItem key={child.title}>
                                                      <SidebarMenuButton type='button' className='h-5 sm:h-6' asChild>
                                                         <div
                                                            className={cn(
                                                               "flex items-center gap-2 sm:gap-3 w-full text-sidebar-foreground hover:text-secondary hover:bg-secondary/5 transition-all text-sm sm:text-base cursor-pointer select-none py-0.5",
                                                               location.pathname.includes(child.path) &&
                                                                  "bg-secondary/5! font-semibold text-secondary!",
                                                            )}
                                                            onClick={() => navigate(child.path)}
                                                         >
                                                            {child.icon ? (
                                                               <child.icon className='size-3 sm:size-4' />
                                                            ) : (
                                                               <span className='size-3 sm:size-4' />
                                                            )}
                                                            <h1 className='text-xs sm:text-sm'>{child.title}</h1>
                                                         </div>
                                                      </SidebarMenuButton>
                                                   </SidebarMenuSubItem>
                                                ),
                                             )}
                                          </SidebarMenuSub>
                                       </CollapsibleContent>
                                    </SidebarMenuItem>
                                 </Collapsible>
                              ) : (
                                 <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                       <ITooltip
                                          label={item.disabled ? "Under Development" : ""}
                                          placement='right'
                                          sideOffset={0}
                                       >
                                          <div
                                             className={cn(
                                                `flex items-center justify-between gap-2 sm:gap-3 w-full text-sidebar-foreground hover:bg-secondary/5 rounded p-1 sm:p-1.5 hover:text-secondary transition-all text-sm sm:text-base cursor-pointer select-none`,
                                                item.disabled && "opacity-50",
                                                location.pathname === item.path &&
                                                   "bg-secondary/5 font-semibold text-secondary",
                                             )}
                                             onClick={() => (item.disabled ? {} : navigate(item.path))}
                                          >
                                             <div className='flex items-center gap-1.5 sm:gap-2 w-full text-xs sm:text-sm'>
                                                <item.icon className='size-3.5 sm:size-4' />
                                                <h1>{item.title}</h1>
                                             </div>
                                          </div>
                                       </ITooltip>
                                    </SidebarMenuButton>
                                 </SidebarMenuItem>
                              ),
                           )}
                        </SidebarMenu>
                     </SidebarGroupContent>
                  </SidebarGroup>
               ) : null,
            )}

            <SidebarGroup>
               <SidebarGroupLabel className='text-sidebar-foreground text-xs sm:text-sm'>Account</SidebarGroupLabel>
               <SidebarGroupContent>
                  <SidebarMenuItem className='flex items-center justify-between'>
                     <SidebarMenuButton asChild>
                        <div
                           className={cn(
                              `flex items-center justify-between gap-2 sm:gap-3 w-full text-sidebar-foreground hover:bg-secondary/5! rounded p-1 sm:p-1.5 hover:text-secondary! transition-all text-sm sm:text-base cursor-pointer select-none`,
                              location.pathname === ACCOUNT.path && "bg-secondary/5 font-semibold text-secondary",
                           )}
                           onClick={() => navigate(ACCOUNT.path)}
                        >
                           <span className='flex items-center gap-1.5 sm:gap-2'>
                              <User2 className='size-3.5 sm:size-4' />
                              <span className='text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none'>
                                 {user.username}
                              </span>
                           </span>
                        </div>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               </SidebarGroupContent>
            </SidebarGroup>
         </SidebarContent>
         <SidebarFooter className='bg-sidebar p-1.5 sm:p-2'>
            <IButtonConfirm
               asButton
               triggerClassName='hover:text-white text-destructive mb-2 text-start w-full flex items-center border border-destructive justify-center bg-red-100 hover:bg-red-600 gap-2 group'
               title='Sign Out'
               message='Are you sure you want to sign out?'
               onConfirm={onSignOut}
            >
               <LogOutIcon className='text-inherit size-4' />
               Sign Out
            </IButtonConfirm>
            <SidebarMenu>
               <p className='text-gray-400 text-[10px] sm:text-xs'>Version {import.meta.env.VITE_APP_VERSION}</p>
            </SidebarMenu>
         </SidebarFooter>
      </Sidebar>
   );
}
