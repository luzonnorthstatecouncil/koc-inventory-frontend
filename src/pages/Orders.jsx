import PageLayout from "@/layout/PageLayout";
import { AUDIT_LOGS, HOME, ORDERS } from "@/constants/routes";
import { ArrowRight, Dot, EyeIcon, Printer, ReceiptText, TriangleAlert } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { Badge } from "@/components/ui/badge";
import { isPast } from "date-fns";
import { dateParser, padwithZero, priceParser } from "@/helpers/parser";
import ITooltip from "@/components/custom/Tooltip";
import { cn } from "@/lib/utils";
import { useGetLogsQuery } from "@/features/api/activityLog";
import Paragraph from "@/components/custom/Paragraph";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
   useGetAllOrdersQuery,
   useGetOrderStatisticsQuery,
   useRefundOrderMutation,
   useVoidRefundOrderMutation,
} from "@/features/api/order";
import { useCallback, useMemo } from "react";
import ILineChart from "@/components/custom/LineChart";
import { Separator } from "@radix-ui/react-dropdown-menu";
import ViewOrder from "@/components/modals/orders/View";
import { useDispatch, useSelector } from "react-redux";
import { setOpenRefundModal, setOpenViewModal, setSelectedOrder } from "@/features/slice/orderSlice";
import { useConfirmation } from "@/helpers/confirmAction";
import { toast } from "sonner";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import RefundOrder from "@/components/modals/orders/RefundOrder";
import { exportOrdersToExcel } from "@/helpers/exportReports";
import { printInvoice } from "@/helpers/printInvoice";

const breadcrumbItems = [{ label: HOME.title }, { label: ORDERS.title }];

const columns = [
   {
      key: "id",
      title: "Order Number",
      render: (value) => `#${padwithZero(value)}`,
   },
   {
      key: "order_number",
      title: "Order Ref No.",
   },
   {
      key: "payments.payment_method",
      title: "Payment Method",
      render: (value, item) => {
         const isCompleted = item?.payments.status === "Completed";
         const badgeColor = isCompleted ? "text-green-600 border-green-600" : "text-yellow-600 border-yellow-600";
         return (
            <Badge variant='outline' className={cn("font-semibold", badgeColor)}>
               {item?.payments.status} via <span className='capitalize'>{value}</span>
            </Badge>
         );
      },
   },
   {
      key: "order_total",
      title: "Total",
      render: (value) => priceParser(value),
   },
   {
      key: "items",
      title: "Items",
      render: (value) => `${value.length} item${value.length > 1 ? "s" : ""}`,
   },
   {
      key: "created_at",
      width: "170px",
      title: "Date Checkout",
      render: (value) => dateParser(value),
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
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();

   const { openViewModal, openRefundModal } = useSelector((state) => state.order);

   const [refundOrder] = useRefundOrderMutation();
   const [voidRefundOrder] = useVoidRefundOrderMutation();
   const { data: orderStatistics } = useGetOrderStatisticsQuery();
   const { data: ordersData } = useGetAllOrdersQuery({});

   const onViewOrder = useCallback((item) => {
      dispatch(setOpenViewModal(true));
      dispatch(setSelectedOrder(item));
   }, []);

   const onCloseView = useCallback(() => {
      dispatch(setOpenViewModal(false));
      dispatch(setSelectedOrder(null));
   }, []);

   const onCloseRefund = useCallback(() => {
      dispatch(setOpenRefundModal(false));
      dispatch(setSelectedOrder(null));
   }, []);

   const onRefundOrder = useCallback(async (item) => {
      dispatch(setOpenRefundModal(true));
      dispatch(setSelectedOrder(item));
   }, []);

   const onConfirmRefund = useCallback(async (data) => {
      dispatch(setOpenRefundModal(false));

      const confirmed = await confirm({
         title: "Confirm Refund",
         message: `Are you sure you want to refund Order #${padwithZero(data.id)}? This action cannot be undone.`,
         confirmLabel: "Yes, Refund",
      });

      if (!confirmed) return;

      const id = toast.loading("Processing refund...");

      const { success, result, message } = await exec(refundOrder, data);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message || `Order #${padwithZero(data.id)} refunded successfully`, { id });
   }, []);

   const onConfirmVoidRefund = useCallback(async (data) => {
      dispatch(setOpenRefundModal(false));

      const confirmed = await confirm({
         title: "Confirm Void Refund",
         message: `Are you sure you want to void the refund for Refund Order #${padwithZero(data.id)}? This action cannot be undone.`,
         confirmLabel: "Yes, Void Refund",
      });

      if (!confirmed) return;

      const id = toast.loading("Processing void refund...");

      const { success, result, message } = await exec(voidRefundOrder, data?.id);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message || `Order #${padwithZero(data.id)} voided refund successfully`, { id });
   }, []);

   const handleExportOrders = useCallback(() => {
      if (!ordersData?.data || ordersData.data.length === 0) {
         toast.error("No orders available to export");
         return;
      }

      const filename = `orders-export-${new Date().toISOString().split("T")[0]}.xlsx`;
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
               return !Boolean(item.refundedOrder);
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
                  cart: (item.items || []).map((orderItem) => ({
                     name: `${orderItem.product?.inventory?.name || "Unknown Item"}`,
                     variant_option: orderItem.product?.variant_name || "",
                     quantity: orderItem.quantity || 0,
                     price: orderItem.product?.inventory?.price || 0,
                  })),
                  paymentMethod: item.payments?.payment_method || "N/A",
                  subtotal: item.order_total || 0,
                  total: item.order_total || 0,
                  amountTendered: item.payments?.amount_tendered || null,
                  change: item.payments?.change_given || 0,
                  orderNumber: item.order_number,
               };

               printInvoice(transactionData, item.id, new Date(item.created_at));
            },
         },
      ],
      [onViewOrder, onRefundOrder, onConfirmVoidRefund],
   );

   return (
      <PageLayout breadcrumbItems={breadcrumbItems} pageTitle={ORDERS.title} route={ORDERS}>
         <header className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 w-full mt-2 sm:mt-4'>
            <ILineChart
               data={orderStatistics?.totalOrders || []}
               mode='linear'
               title='Total Orders'
               xAxisKey='week'
               description='Per week this month'
               wrapperClassName='bg-white'
               chartClassName='h-20 w-full'
               config={{
                  total: {
                     label: "Total",
                     color: "var(--chart-6)",
                  },
               }}
            />
            <ILineChart
               data={orderStatistics?.totalCompleted || []}
               mode='linear'
               title='Total Completed'
               xAxisKey='week'
               description='Per week this month'
               wrapperClassName='bg-white'
               chartClassName='h-20 w-full'
               config={{
                  total: {
                     label: "Total",
                     color: "var(--chart-6)",
                  },
               }}
            />
            <ILineChart
               data={orderStatistics?.totalRefunded || []}
               mode='linear'
               title='Total Refunded'
               xAxisKey='week'
               description='Per week this month'
               wrapperClassName='bg-white'
               chartClassName='h-20 w-full'
               config={{
                  total: {
                     label: "Total",
                     color: "var(--chart-6)",
                  },
               }}
            />
            <ILineChart
               data={orderStatistics?.totalItemsOrdered || []}
               mode='linear'
               title='Total Items Ordered'
               xAxisKey='week'
               description='Per week this month'
               wrapperClassName='bg-white'
               chartClassName='h-20 w-full'
               config={{
                  total: {
                     label: "Total",
                     color: "var(--chart-6)",
                  },
               }}
            />
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
            actionButtons={[
               {
                  label: "Export Current List",
                  onClick: handleExportOrders,
               },
            ]}
         />

         {openViewModal && <ViewOrder isOpen={openViewModal} onClose={onCloseView} />}
         {openRefundModal && (
            <RefundOrder isOpen={openRefundModal} onClose={onCloseRefund} onConfirm={onConfirmRefund} />
         )}
      </PageLayout>
   );
}
