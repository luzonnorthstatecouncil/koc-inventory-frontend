import PageLayout from "@/layout/PageLayout";
import { REPORTS } from "@/constants/routes";
import { FileText } from "lucide-react";
import IButton from "@/components/custom/Button";
import ITabs from "@/components/custom/Tabs";
import StatCard, { StatCardSkeleton } from "@/components/custom/StatCard";
import ReorderReportTab from "@/components/custom/reports/ReorderReportTab";
import VelocityReportTab from "@/components/custom/reports/VelocityReportTab";
import SalesReportTab from "@/components/custom/reports/SalesReportTab";
import ShiftsReportTab from "@/components/custom/reports/ShiftsReportTab";
import { useGetInventoryStatusReportQuery, useGetReportDashboardStatusQuery } from "@/features/api/inventory";
import { useReportSummary } from "@/hooks/useReportSummary";
import { toast } from "sonner";

export default function Reports() {
   const dateRange = "7"; // fixed 7-day window (no picker on this page)

   const { data: inventoryData } = useGetInventoryStatusReportQuery(
      { page: 1, pageSize: 1000, show_low_stock: true },
      { refetchOnMountOrArgChange: true },
   );

   const { data: dashboardData, isLoading: dashboardLoading } = useGetReportDashboardStatusQuery(
      { page: 1, pageSize: 1000, show_low_stock: true },
      { refetchOnMountOrArgChange: true },
   );

   const { summaryCards } = useReportSummary(dashboardData);

   const handleExport = async () => {
      if (!inventoryData || inventoryData.length === 0) {
         toast.error("No data available to export");
         return;
      }

      // Spreadsheet/PDF libraries load only when exporting
      const { exportToCSV, getInventoryStatusColumns } = await import("@/helpers/exportReports");
      const columns = getInventoryStatusColumns();
      const filename = `inventory-summary-report-${new Date().toISOString().split("T")[0]}.xlsx`;
      exportToCSV(inventoryData, columns, filename);
      toast.success("Inventory Summary Report exported successfully");
   };

   return (
      <PageLayout route={REPORTS}>
         <div className='flex w-full flex-col gap-5'>
            <header className='flex flex-wrap items-start justify-between gap-4'>
               <div className='min-w-0'>
                  <h1 className='text-2xl font-bold tracking-tight text-foreground'>Reports</h1>
                  <p className='text-sm text-neutral-500'>What’s low, what isn’t moving, and how much stock is on the shelves.</p>
               </div>
               <IButton variant='outline' onClick={handleExport} className='shrink-0'>
                  <FileText className='size-4' />
                  <span className='hidden sm:inline'>Export summary report</span>
                  <span className='sm:hidden'>Export</span>
               </IButton>
            </header>

            {/* Stat cards */}
            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4'>
               {dashboardLoading
                  ? Array.from({ length: 4 }).map((_, index) => <StatCardSkeleton key={index} />)
                  : summaryCards.map((card, index) => <StatCard key={index} {...card} />)}
            </div>

            {/* Report tabs */}
            <ITabs
               defaultValue='reorder'
               tabListClassName='h-12 p-1.5'
               items={[
                  {
                     value: "reorder",
                     label: "Reorder Report",
                     content: <ReorderReportTab dateRange={dateRange} />,
                  },
                  {
                     value: "velocity",
                     label: "Stocks Velocity",
                     content: <VelocityReportTab dateRange={dateRange} />,
                  },
                  {
                     value: "sales",
                     label: "Sales",
                     content: <SalesReportTab />,
                  },
                  {
                     value: "shifts",
                     label: "Shifts",
                     content: <ShiftsReportTab />,
                  },
               ]}
            />
         </div>
      </PageLayout>
   );
}
