import { LogOutIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";
import { useLogout } from "@/hooks/useLogout";
import { ACCOUNT, NAV_GROUPS, STOCK_APPROVALS } from "@/constants/routes";
import { ROLE_OPTIONS } from "@/constants/options";
import { useGetAllStockApprovalsQuery } from "@/features/api/inventory";
import { cn } from "@/lib/utils";
import LogoWordmark from "@/assets/images/logos/logo_wordmark_white.png";

const initials = (name = "") =>
   name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

function PendingApprovalsBadge() {
   // Page size 1: only the total is needed.
   const { data } = useGetAllStockApprovalsQuery(
      { admin_side: true, status: "pending", page: 1, pageSize: 1 },
      { pollingInterval: 60_000, refetchOnFocus: true },
   );
   const count = data?.pagination?.total ?? 0;
   if (!count) return null;

   return (
      <span
         className='ml-auto inline-flex h-5 min-w-5.5 items-center justify-center rounded-full bg-emphasis px-1.5 text-xs font-bold text-emphasis-foreground tabular-nums'
         aria-label={`${count} pending`}
      >
         {count > 99 ? "99+" : count}
      </span>
   );
}

function NavItem({ item, showBadge, onNavigate }) {
   const location = useLocation();
   const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
   const Icon = item.icon;

   if (item.disabled) {
      return (
         <span
            aria-disabled='true'
            title='Coming soon'
            className='flex h-10 items-center gap-3 rounded-md px-3 text-base font-medium text-sidebar-muted/70'
         >
            {Icon && <Icon className='size-5 shrink-0' strokeWidth={1.75} />}
            {item.navTitle ?? item.title}
         </span>
      );
   }

   return (
      <NavLink
         to={item.path}
         onClick={onNavigate}
         aria-current={isActive ? "page" : undefined}
         className={cn(
            "flex h-10 items-center gap-3 rounded-md px-3 text-base font-medium text-sidebar-foreground transition-colors duration-150 hover:bg-sidebar-hover hover:text-white focus-visible:outline-white",
            isActive && "bg-sidebar-accent font-semibold text-white",
         )}
      >
         {Icon && (
            <Icon
               className={cn("size-5 shrink-0", isActive ? "text-emphasis" : "text-sidebar-icon")}
               strokeWidth={1.75}
            />
         )}
         <span className='truncate'>{item.navTitle ?? item.title}</span>
         {showBadge && <PendingApprovalsBadge />}
      </NavLink>
   );
}

export function AppSidebar({ user }) {
   const logout = useLogout();
   const { isMobile, setOpenMobile } = useSidebar();
   const roleLabel = ROLE_OPTIONS.find((r) => r.value === user?.role)?.label ?? user?.role;
   const displayName = user?.full_name || user?.fullname || user?.username || "";

   const onNavigate = () => {
      if (isMobile) setOpenMobile(false);
   };

   return (
      <Sidebar className='bg-sidebar'>
         <nav aria-label='Main' className='flex h-full flex-col bg-sidebar px-3 pt-5 pb-4'>
            <img src={LogoWordmark} alt='Knights of Columbus' className='-mt-2 ml-0.5 h-30 w-auto self-start' />

            <div className='-mx-3 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3'>
               {NAV_GROUPS.map((group, groupIndex) => {
                  const items = group.items.filter((item) => !item.roles || item.roles.includes(user?.role));
                  if (items.length === 0) return null;

                  return (
                     <div key={group.title} className='flex flex-col gap-0.5'>
                        <div
                           className={cn(
                              "px-3 pb-1.5 text-sm font-semibold text-sidebar-muted",
                              groupIndex > 0 ? "pt-5" : "pt-0",
                           )}
                        >
                           {group.title}
                        </div>
                        {items.map((item) => (
                           <NavItem
                              key={item.path}
                              item={item}
                              onNavigate={onNavigate}
                              showBadge={item.path === STOCK_APPROVALS.path && user?.role === "admin"}
                           />
                        ))}
                     </div>
                  );
               })}
            </div>

            <div className='mt-4 flex items-center gap-2.5 border-t border-sidebar-border px-1 pt-3'>
               <NavLink
                  to={ACCOUNT.path}
                  onClick={onNavigate}
                  className='flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-sidebar-hover focus-visible:outline-white'
                  aria-label={`Account settings for ${displayName}`}
               >
                  <span className='flex size-9 shrink-0 items-center justify-center rounded-full bg-[#2A4385] text-sm font-semibold text-white'>
                     {initials(displayName)}
                  </span>
                  <span className='flex min-w-0 flex-col'>
                     <span className='truncate text-base font-semibold text-white'>{displayName}</span>
                     <span className='truncate text-sm text-sidebar-muted'>{roleLabel}</span>
                  </span>
               </NavLink>
               <button
                  type='button'
                  aria-label='Sign out'
                  title='Sign out'
                  onClick={() => logout()}
                  className='flex size-8 shrink-0 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white focus-visible:outline-white'
               >
                  <LogOutIcon className='size-5' strokeWidth={1.75} />
               </button>
            </div>
         </nav>
      </Sidebar>
   );
}
