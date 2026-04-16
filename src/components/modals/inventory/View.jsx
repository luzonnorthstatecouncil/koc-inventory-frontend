import ModalSkeleton from "@/components/custom/ModalSkeleton";
import ISidebar from "@/components/custom/Sidebar";
import { useState } from "react";
import ViewAuditTrails from "./View/AuditTrails";
import ViewDetails from "./View/Details";
import ViewStocks from "./View/Stocks";
import ViewVariants from "./View/Variants";

export default function View({ item: inventoryItem, isLoading }) {
   const [selectedTab, setSelectedTab] = useState("details");

   if (isLoading) return <ModalSkeleton />;

   const sidebarItems = [
      {
         key: "details",
         label: "Item Details",
         content: <ViewDetails item={inventoryItem} />,
         action: () => setSelectedTab("details"),
      },
      {
         key: "stocks",
         label: "Stocks",
         content: <ViewStocks item={inventoryItem} />,
         action: () => setSelectedTab("stocks"),
      },
      {
         key: "variants",
         label: "Variants",
         content: <ViewVariants variants={inventoryItem?.variants} />,
         action: () => setSelectedTab("variants"),
      },
      {
         key: "audit-trails",
         label: "Audit Trails",
         content: <ViewAuditTrails item={inventoryItem} />,
         action: () => setSelectedTab("audit-trails"),
      },
   ];

   return (
      <main className='relative flex items-stretch justify-start min-h-50'>
         <ISidebar items={sidebarItems} active={selectedTab} className='py-2' />
         <div className='flex items-start justify-start p-3 pr-0 h-full w-full'>
            {sidebarItems.find((i) => i.key === selectedTab)?.content}
         </div>
      </main>
   );
}
