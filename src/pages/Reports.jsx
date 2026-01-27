import PageLayout from "@/layout/PageLayout";
import { HOME, REPORTS } from "@/constants/routes";
import { Download, FileText } from "lucide-react";
import Title from "@/components/custom/Title";
import Paragraph from "@/components/custom/Paragraph";
import IButton from "@/components/custom/Button";
import ITabs from "@/components/custom/Tabs";
import StatCard from "@/components/custom/StatCard";
import ReorderReportTab from "@/components/custom/reports/ReorderReportTab";
import VelocityReportTab from "@/components/custom/reports/VelocityReportTab";
import { useState } from "react";
import { useGetInventoryStatusReportQuery, useGetReportDashboardStatusQuery } from "@/features/api/inventory";
import ISelect from "@/components/custom/Select";
import { REPORTS_DATE_RANGE_OPTIONS } from "@/constants/options";
import { useReportSummary } from "@/hooks/useReportSummary";
import { exportToCSV, getInventoryStatusColumns } from "@/helpers/exportReports";
import { toast } from "sonner";

const breadcrumbItems = [{ label: HOME.title }, { label: REPORTS.title }];

export default function Reports() {
   const [dateRange, setDateRange] = useState("7");

   const { data: inventoryData } = useGetInventoryStatusReportQuery(
      {
         page: 1,
         pageSize: 1000,
         show_low_stock: true,
      },
      {
         refetchOnMountOrArgChange: true,
      },
   );

   const { data: dashboardData } = useGetReportDashboardStatusQuery(
      {
         page: 1,
         pageSize: 1000,
         show_low_stock: true,
      },
      {
         refetchOnMountOrArgChange: true,
      },
   );

   const { outOfStock, stockHealthScore, totalInventoryItems, totalInventoryValue } = dashboardData || {};
   const { summaryCards } = useReportSummary(dashboardData);

   const handleExport = () => {
      if (!inventoryData || inventoryData.length === 0) {
         toast.error("No data available to export");
         return;
      }

      const columns = getInventoryStatusColumns();
      const filename = `inventory-summary-report-${new Date().toISOString().split("T")[0]}.xlsx`;
      const title = "Inventory Summary Report";

      exportToCSV(inventoryData, columns, filename);

      toast.success(`${title} exported successfully`);
   };

   return (
      <PageLayout breadcrumbItems={breadcrumbItems} route={REPORTS}>
         <div className='space-y-4 sm:space-y-6 w-full'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4'>
               <div>
                  <Title className='text-xl sm:text-2xl'>Inventory Reports & Analytics</Title>
                  <Paragraph className='text-muted-foreground text-sm sm:text-base'>
                     Answer in 10 seconds: What's low? What's not moving? How much money is on shelves?
                  </Paragraph>
               </div>
               <IButton variant='outline' icon={Download} onClick={handleExport} className='text-xs sm:text-sm'>
                  <FileText className='size-4' /> <span className='hidden sm:inline'>Export Summary Report</span><span className='sm:hidden'>Export</span>
               </IButton>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
               {summaryCards.map((card, index) => (
                  <StatCard key={index} {...card} />
               ))}
            </div>

            <ITabs
               defaultValue='reorder'
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
