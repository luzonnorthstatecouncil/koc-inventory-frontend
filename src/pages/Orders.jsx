import PageLayout from "@/layout/PageLayout";
import { HOME, ORDERS } from "@/constants/routes";
import {
   Ban,
   CheckCircle2,
   CreditCard,
   EyeIcon,
   Minus,
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
   useVoidOrderMutation,
   useVoidRefundOrderMutation,
} from "@/features/api/order";
import { useState, useCallback, useMemo } from "react";
import ILineChart from "@/components/custom/LineChart";
import { Skeleton } from "@/components/ui/skeleton";

import ViewOrder from "@/components/modals/orders/View";
import { useModalState } from "@/hooks/useModalState";
import { useConfirmation } from "@/helpers/confirmAction";
import { toast } from "sonner";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import RefundOrder from "@/components/modals/orders/RefundOrder";
import { printOrderReceipt } from "@/helpers/printInvoice";
import VoidOrder from "@/components/modals/orders/VoidOrder";
import { canRefund, canVoidRefund, canVoidSale, orderStatus } from "@/helpers/orderStatus";

const MANAGER_ROLES = ["admin", "supervisor"];

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
   { key: "totalOrders", title: "Total orders", icon: ShoppingCart },
   { key: "totalCompleted", title: "Completed", icon: CheckCircle2 },
   { key: "totalRefunded", title: "Refunded", icon: RefreshCcw },
   { key: "totalItemsOrdered", title: "Items ordered", icon: Package },
];

function OrderStatCardSkeleton() {
   return (
      <div className='rounded-xl border border-neutral-200 bg-white p-4' aria-hidden='true'>
         <div className='flex items-center justify-between'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='size-4' />
         </div>
         <Skeleton className='mt-3 h-8 w-20' />
         <Skeleton className='mt-2 h-3.5 w-32' />
         <Skeleton className='mt-3 h-12 w-full' />
      </div>
   );
}

function OrderStatCard({ data = [], title, icon: Icon, isLoading }) {
   const { total, trend } = computeStats(data);

   if (isLoading) return <OrderStatCardSkeleton />;

   const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

   return (
      <div className='rounded-xl border border-neutral-200 bg-white p-4'>
         <div className='flex items-center justify-between gap-2'>
            <p className='text-sm font-medium text-neutral-600'>{title}</p>
            <Icon className='size-4 text-neutral-400' aria-hidden='true' />
         </div>
         <p className='mt-2 text-3xl leading-none font-bold tracking-tight text-foreground tabular-nums'>
            {total.toLocaleString()}
         </p>
         {/* Neutral on purpose: "up" is good for orders but bad for refunds. */}
         <p className='mt-2 flex h-5 items-center gap-1 text-xs text-neutral-500 tabular-nums'>
            {trend !== null && (
               <>
                  <TrendIcon className='size-3.5' aria-hidden='true' />
                  <span className='font-semibold text-neutral-700'>
                     {trend > 0 ? "+" : ""}
                     {trend}%
                  </span>
                  vs last week
               </>
            )}
         </p>

         <ILineChart
            data={data}
            mode='linear'
            xAxisKey='week'
            wrapperClassName='!p-0 !border-0 !shadow-none bg-transparent mt-2'
            chartClassName='h-12 w-full'
            config={{ total: { label: "Total", color: "var(--primary)" } }}
         />
      </div>
   );
}

const PAYMENT_METHOD_ICONS = {
   cash: Wallet,
   card: CreditCard,
   gcash: ShoppingBag,
};


const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";

const columns = [
   {
      key: "id",
      title: "Order",
      width: "160px",
      render: (value, item) => (
         <div className='flex flex-col gap-0.5'>
            <span className={cn(primaryText, "font-semibold tabular-nums")}>#{padwithZero(value)}</span>
            <span className={cn(secondaryText, "tabular-nums")}>{item.order_number}</span>
         </div>
      ),
   },
   {
      key: "invoice_number",
      title: "Invoice",
      width: "120px",
      render: (value) =>
         value ? (
            <span className={cn(primaryText, "tabular-nums")}>{value}</span>
         ) : (
            <span className='text-sm text-neutral-500'>—</span>
         ),
   },
   {
      key: "created_at",
      title: "Date",
      width: "150px",
      render: (value) => (
         <div className='flex flex-col gap-0.5'>
            <span className={primaryText}>{dateParser(value, "PP")}</span>
            <span className={cn(secondaryText, "tabular-nums")}>{dateParser(value, "p")}</span>
         </div>
      ),
   },
   {
      key: "payments.payment_method",
      title: "Payment",
      width: "120px",
      render: (value) => {
         const PayIcon = PAYMENT_METHOD_ICONS[value?.toLowerCase()] ?? CreditCard;
         return (
            <span className={cn(primaryText, "inline-flex items-center gap-2 capitalize")}>
               <PayIcon className='size-4 text-neutral-400' aria-hidden='true' />
               {value || "—"}
            </span>
         );
      },
   },
   {
      key: "items",
      title: "Items",
      width: "90px",
      render: (value = []) => (
         <span className={cn(primaryText, "tabular-nums")}>
            {value.length} <span className='font-medium text-neutral-500'>{value.length === 1 ? "item" : "items"}</span>
         </span>
      ),
   },
   {
      key: "payments.status",
      title: "Status",
      width: "120px",
      render: (_, item) => {
         const status = orderStatus(item);
         return (
            <span className={cn("inline-flex items-center gap-2 text-sm font-medium", status.text)}>
               <span className={cn("size-2 rounded-full", status.dot)} aria-hidden='true' />
               {status.label}
            </span>
         );
      },
   },
   {
      key: "order_total",
      title: "Total",
      width: "130px",
      headerClassName: "text-end",
      cellClassName: "text-end",
      render: (value) => <span className='text-sm font-semibold text-foreground tabular-nums'>{priceParser(value)}</span>,
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
   const openVoidModal = modal.is("void");

   const [params, setParams] = useState({});

   const [refundOrder] = useRefundOrderMutation();
   const [voidRefundOrder] = useVoidRefundOrderMutation();
   const [voidOrder] = useVoidOrderMutation();
   const { data: orderStatistics, isLoading: statsLoading } = useGetOrderStatisticsQuery({
      dateFrom: params.dateRange?.from,
      dateTo: params.dateRange?.to,
   });
   const { data: ordersData } = useGetAllOrdersQuery({});

   const onViewOrder = useCallback((item) => openModal("view", item), [openModal]);
   const onCloseView = closeModal;
   const onCloseRefund = closeModal;
   const onRefundOrder = useCallback((item) => openModal("refund", item), [openModal]);
   const onVoidOrder = useCallback((item) => openModal("void", item), [openModal]);

   const onConfirmVoid = useCallback(
      async (data) => {
         closeModal();
         const id = toast.loading("Voiding sale...");
         const { success, message } = await exec(voidOrder, data);
         if (!success) return toast.error(message || "The sale wasn't voided.", { id });
         toast.success(message || `Order #${padwithZero(data.id)} voided`, { id });
      },
      [closeModal, exec, voidOrder],
   );

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
         toast.error(message || "The refund wasn't processed.", { id });
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
         toast.error(message || "The refund wasn't voided.", { id });
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
            // The API refuses refunds and voids from staff accounts too
            roles: MANAGER_ROLES,
            show: canRefund,
            action: onRefundOrder,
         },
         {
            key: "void",
            label: "Void Sale",
            icon: Ban,
            roles: MANAGER_ROLES,
            show: canVoidSale,
            action: onVoidOrder,
         },
         {
            key: "void_refund",
            label: "Void Refund",
            icon: TriangleAlert,
            roles: MANAGER_ROLES,
            show: canVoidRefund,
            action: onConfirmVoidRefund,
         },
         {
            key: "print_invoice",
            label: "Print Invoice",
            icon: Printer,
            // Lines print at the prices they sold for, not today's
            action: printOrderReceipt,
         },
      ],
      [onViewOrder, onRefundOrder, onVoidOrder, onConfirmVoidRefund],
   );

   return (
      <PageLayout
        
         pageTitle={ORDERS.title}
         pageDescription='Manage your orders. View details, process refunds, and keep track of your order history all in one place.'
         route={ORDERS}
      >
         <header className='mt-2 grid w-full grid-cols-1 gap-3 sm:mt-4 sm:grid-cols-2 lg:grid-cols-4'>
            {STAT_CONFIGS.map(({ key, ...cfg }) => (
               <OrderStatCard key={key} data={orderStatistics?.[key] || []} isLoading={statsLoading} {...cfg} />
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
         {openVoidModal && <VoidOrder isOpen={openVoidModal} onClose={closeModal} onConfirm={onConfirmVoid} order={modal.item} />}
      </PageLayout>
   );
}
