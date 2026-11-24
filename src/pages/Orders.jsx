import PageLayout from "@/layout/PageLayout";
import { HOME, ORDERS } from "@/constants/routes";
import {
   CheckCircle2,
   CreditCard,
   EyeIcon,
   Package,
   Printer,
   ReceiptText,
   RefreshCcw,
   ShoppingBag,
   ShoppingCart,
   TrendingDown,
   TrendingUp,
   TriangleAlert,
   Wallet,
} from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { dateParser, padwithZero, priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import {
   useGetAllOrdersQuery,
   useGetOrderStatisticsQuery,
   useRefundOrderMutation,
   useVoidRefundOrderMutation,
} from "@/features/api/order";
import { useState, useCallback, useMemo } from "react";
import ILineChart from "@/components/custom/LineChart";

import ViewOrder from "@/components/modals/orders/View";
import { useModalState } from "@/hooks/useModalState";
import { useConfirmation } from "@/helpers/confirmAction";
import { toast } from "sonner";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import RefundOrder from "@/components/modals/orders/RefundOrder";
import { printInvoice } from "@/helpers/printInvoice";
import { describeOrderItem } from "@/helpers/orderItems";

function computeStats(data = []) {
   const total = data.reduce((sum, d) => sum + (d.total || 0), 0);
   if (data.length === 0) return { total, trend: null };

   const last = data.at(-1)?.total ?? 0;
   const prev = data.length > 1 ? (data.at(-2)?.total ?? 0) : 0;

   let trend = null;
   if (prev === 0) {
      if (last > 0) {
         trend = 100;
      } else {
         trend = null;
      }
   } else {
      trend = Number((((last - prev) / prev) * 100).toFixed(1));
   }

   return { total, trend };
}

const STAT_CONFIGS = [
   {
      key: "totalOrders",
      title: "Total Orders",
      icon: ShoppingCart,
      chartColor: "var(--chart-6)",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
   },
   {
      key: "totalCompleted",
      title: "Completed",
      icon: CheckCircle2,
      chartColor: "var(--chart-1)",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
   },
   {
      key: "totalRefunded",
      title: "Refunded",
      icon: RefreshCcw,
      chartColor: "var(--chart-2)",
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
   },
   {
      key: "totalItemsOrdered",
      title: "Items Ordered",
      icon: Package,
      chartColor: "var(--chart-4)",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
   },
];

function OrderStatCard({ data = [], title, icon: Icon, chartColor, accent, iconBg, iconColor }) {
   const { total, trend } = computeStats(data);

   return (
      <div className='relative rounded-xl overflow-hidden border bg-white hover:shadow-md transition-all duration-200'>
         <div className={cn("h-1 w-full")} />
         <div className='p-4'>
            <div className='flex items-start justify-between mb-2'>
               <div>
                  <p className='text-sm font-semibold text-muted-foreground tracking-widest uppercase'>{title}</p>
                  <p className='text-3xl font-bold tabular-nums mt-1 text-foreground leading-none'>
                     {total.toLocaleString()}
                  </p>
               </div>
               <div className={cn("p-2 rounded-lg", iconBg)}>
                  <Icon className={cn("size-4", iconColor)} />
               </div>
            </div>

            {trend !== null ? (
               <div
                  className={cn(
                     "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mb-3",
                     trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600",
                  )}
               >
                  {trend >= 0 ? <TrendingUp className='size-3' /> : <TrendingDown className='size-3' />}
                  {`${trend >= 0 ? "+" : ""}${trend}% vs last week`}
               </div>
            ) : (
               <div className='h-6 mb-3' />
            )}

            <ILineChart
               data={data}
               mode='linear'
               xAxisKey='week'
               wrapperClassName='!p-0 !border-0 !shadow-none bg-transparent'
               chartClassName='h-16 w-full'
               config={{ total: { label: "Total", color: chartColor } }}
            />
         </div>
      </div>
   );
}

const PAYMENT_METHOD_ICONS = {
   cash: Wallet,
   card: CreditCard,
   gcash: ShoppingBag,
};

const columns = [
   {
      key: "id",
      title: "Order",
      width: "130px",
      render: (value, item) => (
         <div className='flex flex-col'>
            <span className='font-mono text-sm font-bold text-foreground tracking-wider'>#{padwithZero(value)}</span>
            <span className='text-sm text-muted-foreground font-mono'>{item.order_number}</span>
            {item.invoice_number && (
               <span className='text-xs text-muted-foreground font-mono'>INV {item.invoice_number}</span>
            )}
         </div>
      ),
   },
   {
      key: "payments.payment_method",
      title: "Payment",
      width: "190px",
      render: (value, item) => {
         const isCompleted = item?.payments?.status === "Completed";
         const PayIcon = PAYMENT_METHOD_ICONS[value?.toLowerCase()] ?? CreditCard;
         return (
            <div className='flex flex-col gap-1'>
               <div className='flex items-center gap-1.5'>
                  <span className='inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-lg capitalize'>
                     <PayIcon className='size-3 text-gray-500' />
                     {value}
                  </span>
               </div>
               <span
                  className={cn(
                     "inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full w-fit",
                     isCompleted
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200",
                  )}
               >
                  <span
                     className={cn(
                        "size-1.5 rounded-full",
                        isCompleted ? "bg-emerald-500" : "bg-amber-400 animate-pulse",
                     )}
                  />
                  {item?.payments?.status}
               </span>
            </div>
         );
      },
   },
   {
      key: "order_total",
      title: "Total",
      width: "130px",
      render: (value) => <span className='font-bold text-sm tabular-nums text-foreground'>{priceParser(value)}</span>,
   },
   {
      key: "items",
      title: "Items",
      width: "95px",
      render: (value) => (
         <span className='inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full'>
            <Package className='size-3' />
            {value.length}
         </span>
      ),
   },
   {
      key: "created_at",
      width: "150px",
      title: "Date Checkout",
      render: (value) => <span className='text-sm font-semibold text-foreground'>{dateParser(value)}</span>,
   },
];

const stockFilters = [
   {
      key: "received_at",
      label: "Date Range",
      type: "date",
   },
];

export default function Orders() {
   const modal = useModalState();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();

   const { open: openModal, close: closeModal } = modal;
   const openViewModal = modal.is("view");
   const openRefundModal = modal.is("refund");

   const [params, setParams] = useState({});

   const [refundOrder] = useRefundOrderMutation();
   const [voidRefundOrder] = useVoidRefundOrderMutation();
   const { data: orderStatistics } = useGetOrderStatisticsQuery({
      dateFrom: params.dateRange?.from,
      dateTo: params.dateRange?.to,
   });
   const { data: ordersData } = useGetAllOrdersQuery({});

   const onViewOrder = useCallback((item) => openModal("view", item), [openModal]);
   const onCloseView = closeModal;
   const onCloseRefund = closeModal;
   const onRefundOrder = useCallback((item) => openModal("refund", item), [openModal]);

   const onConfirmRefund = useCallback(async (data) => {
      closeModal();

      const confirmed = await confirm({
         title: "Confirm Refund",
         message: `Are you sure you want to refund Order #${padwithZero(data.id)}? This action cannot be undone.`,
         confirmLabel: "Yes, Refund",
      });

      if (!confirmed) return;

      const id = toast.loading("Processing refund...");

      const { success, message } = await exec(refundOrder, data);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message || `Order #${padwithZero(data.id)} refunded successfully`, { id });
   }, [closeModal, confirm, exec, refundOrder]);

   const onConfirmVoidRefund = useCallback(async (data) => {
      closeModal();

      const confirmed = await confirm({
         title: "Confirm Void Refund",
         message: `Are you sure you want to void the refund for Refund Order #${padwithZero(data.id)}? This action cannot be undone.`,
         confirmLabel: "Yes, Void Refund",
      });

      if (!confirmed) return;

      const id = toast.loading("Processing void refund...");

      const { success, message } = await exec(voidRefundOrder, data?.id);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message || `Order #${padwithZero(data.id)} voided refund successfully`, { id });
   }, [closeModal, confirm, exec, voidRefundOrder]);

   const handleExportOrders = useCallback(async () => {
      if (!ordersData?.data || ordersData.data.length === 0) {
         toast.error("No orders available to export");
         return;
      }

      const filename = `orders-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      // Spreadsheet library loads only when exporting
      const { exportOrdersToExcel } = await import("@/helpers/exportReports");
      exportOrdersToExcel(ordersData.data, filename);
      toast.success(`Orders exported successfully to ${filename}`);
   }, [ordersData]);

   const actions = useMemo(
      () => [
         {
            key: "view",
            label: "View Details",
            icon: EyeIcon,
            action: onViewOrder,
         },
         {
            key: "refund",
            label: "Refund Order",
            icon: ReceiptText,
            show: (item) => {
               return !item.refundedOrder;
            },
            action: onRefundOrder,
         },
         {
            key: "void_refund",
            label: "Void Refund",
            icon: TriangleAlert,
            show: (item) => {
               return Boolean(item.refundedOrder);
            },
            action: onConfirmVoidRefund,
         },
         {
            key: "print_invoice",
            label: "Print Invoice",
            icon: Printer,
            action: (item) => {
               const transactionData = {
                  cart: (item.items || []).map((orderItem) => {
                     const line = describeOrderItem(orderItem);
                     return {
                        name: line.name,
                        variant_option: line.isKit ? "Kit" : line.variantName,
                        quantity: orderItem.quantity || 0,
                        price: line.price,
                     };
                  }),
                  paymentMethod: item.payments?.payment_method || "N/A",
                  subtotal: item.order_total || 0,
                  total: item.order_total || 0,
                  amountTendered: item.payments?.amount_tendered || null,
                  change: item.payments?.change_given || 0,
                  orderNumber: item.order_number,
               };

               printInvoice(
                  transactionData,
                  item.invoice_number || item.order_number || item.id,
                  new Date(item.created_at),
               );
            },
         },
      ],
      [onViewOrder, onRefundOrder, onConfirmVoidRefund],
   );

   return (
      <PageLayout
        
         pageTitle={ORDERS.title}
         pageDescription='Manage your orders. View details, process refunds, and keep track of your order history all in one place.'
         route={ORDERS}
      >
         <header className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full mt-2 sm:mt-4'>
            {STAT_CONFIGS.map(({ key, ...cfg }) => (
               <OrderStatCard key={key} data={orderStatistics?.[key] || []} {...cfg} />
            ))}
         </header>

         <DataTable
            query={{
               useQuery: useGetAllOrdersQuery,
               options: {
                  refetchOnMountOrArgChange: true,
               },
            }}
            columns={columns}
            wrapperClassName='mt-2'
            filterable
            filters={stockFilters}
            actions={actions}
            onParamsChange={setParams}
            actionButtons={[
               {
                  label: "Export Current List",
                  onClick: handleExportOrders,
               },
            ]}
         />

         {openViewModal && (
            <ViewOrder isOpen={openViewModal} onClose={onCloseView} order={modal.item} onSelectOrder={modal.setItem} />
         )}
         {openRefundModal && (
            <RefundOrder isOpen={openRefundModal} onClose={onCloseRefund} onConfirm={onConfirmRefund} order={modal.item} />
         )}
      </PageLayout>
   );
}
