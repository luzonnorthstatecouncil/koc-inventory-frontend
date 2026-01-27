import ModalSkeleton from "@/components/custom/ModalSkeleton";
import ISidebar from "@/components/custom/Sidebar";
import { useMemo, useState } from "react";
import ViewOrder from "../orders/View";
import { dateParser, padwithZero } from "@/helpers/parser";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import Details from "@/components/custom/Details";
import Each from "@/components/custom/Each";
import OrderItem from "../orders/ui/OrderItem";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReceiptText } from "lucide-react";

export default function Orders({ item: orders, isLoading }) {
   const [selectedTab, setSelectedTab] = useState("order-0");

   const sidebarItems = useMemo(
      () =>
         orders?.map((order, index) => ({
            key: `order-${index}`,
            label: `Order #${padwithZero(order.id)}`,
            content: <OrderContent order={order} />,
            action: () => setSelectedTab(`order-${index}`),
         })),
      [orders]
   );

   if (isLoading) return <ModalSkeleton />;

   if (!orders || orders.length === 0) {
      return (
         <main className='flex items-center justify-center min-h-30'>
            <Paragraph size='md'>No orders available.</Paragraph>
         </main>
      );
   }

   return (
      <main className='relative flex items-stretch justify-start min-h-50'>
         <ISidebar items={sidebarItems} active={selectedTab} className='py-2' />
         <div className='flex items-start justify-start p-3 pr-0 h-full w-full'>
            {sidebarItems.find((i) => i.key === selectedTab)?.content}
         </div>
      </main>
   );
}

const OrderContent = ({ order }) => {
   if (!order) {
      return <Paragraph size='sm'>No order data available.</Paragraph>;
   }

   return (
      <main className='w-full'>
         <header className='flex items-center justify-between w-full'>
            <Title className='flex items-center gap-1'>
               <ReceiptText className='size-5' /> {order.order_number}
            </Title>
            <Paragraph size='xs'>{dateParser(order.created_at)}</Paragraph>
         </header>

         <ScrollArea className='space-y-1 py-2 flex flex-col max-h-120'>
            <Paragraph>Items Ordered:</Paragraph>

            <Each
               of={order?.items}
               render={(item, index) => (
                  <OrderItem
                     key={index}
                     name={`${item.product.inventory.name} - ${item.product.variant_name}`}
                     quantity={item.quantity}
                     price={item.product.inventory.price}
                  />
               )}
            />

            <section className='mt-3 pt-3 border-t border-outline'>
               <OrderItem
                  name='Transaction Ref'
                  parsePrice={false}
                  price={order?.payments.transaction_reference}
                  nameClassName='font-normal'
               />
               <OrderItem name='Amount Tendered' price={order?.payments.amount_tendered} nameClassName='font-normal' />
               <OrderItem name='Subtotal' price={order.subtotal} nameClassName='font-normal' />
               <OrderItem name='Change' price={order?.payments.change_given} nameClassName='font-normal' />
            </section>

            <section className='p-3 rounded-lg bg-gray-200 mt-4 space-y-0.5'>
               <article className='flex items-center justify-between gap-3'>
                  <Badge
                     className={cn(
                        "flex items-center gap-1",
                        order?.payments.status === "Completed"
                           ? "text-green-600 border-green-600 font-semibold"
                           : "text-yellow-600 border-yellow-600"
                     )}
                     variant='outline'
                  >
                     {order?.payments.status} via
                     <span className='capitalize'>{order?.payments.payment_method}</span>
                  </Badge>
                  <Title className='text-black'>PHP {order?.order_total}</Title>
               </article>
            </section>
         </ScrollArea>
      </main>
   );
};
