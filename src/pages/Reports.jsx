import PageLayout from "@/layout/PageLayout";
import { HOME, REPORTS } from "@/constants/routes";
import { BarChart3, Download, FileText } from "lucide-react";
import IButton from "@/components/custom/Button";
import ITabs from "@/components/custom/Tabs";
import StatCard from "@/components/custom/StatCard";
import ReorderReportTab from "@/components/custom/reports/ReorderReportTab";
import VelocityReportTab from "@/components/custom/reports/VelocityReportTab";
import { useGetInventoryStatusReportQuery, useGetReportDashboardStatusQuery } from "@/features/api/inventory";
import { useReportSummary } from "@/hooks/useReportSummary";
import { toast } from "sonner";

export default function Reports() {
   const dateRange = "7"; // fixed 7-day window (no picker on this page)

   const { data: inventoryData } = useGetInventoryStatusReportQuery(
      { page: 1, pageSize: 1000, show_low_stock: true },
      { refetchOnMountOrArgChange: true },
   );

   const { data: dashboardData } = useGetReportDashboardStatusQuery(
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
         <div className='space-y-5 w-full'>
            {/* Page header */}
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/5 via-primary/[0.03] to-transparent border border-primary/10 rounded-2xl px-5 py-4'>
               <div className='flex items-center gap-3'>
                  <div className='p-2.5 bg-primary/10 rounded-xl flex-shrink-0'>
                     <BarChart3 className='size-5 text-primary' />
                  </div>
                  <div>
                     <h2 className='text-base font-bold text-foreground leading-tight'>Inventory Reports & Analytics</h2>
                     <p className='text-xs text-muted-foreground mt-0.5'>
                        Answer in 10 seconds: What's low? What's not moving? How much money is on shelves?
                     </p>
                  </div>
               </div>
               <IButton variant='outline' onClick={handleExport} className='text-xs sm:text-sm flex-shrink-0'>
                  <FileText className='size-4' />
                  <span className='hidden sm:inline'>Export Summary Report</span>
                  <span className='sm:hidden'>Export</span>
               </IButton>
            </div>

            {/* Stat cards */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
               {summaryCards.map((card, index) => (
                  <StatCard key={index} {...card} />
               ))}
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
               ]}
            />
         </div>
      </PageLayout>
   );
}
