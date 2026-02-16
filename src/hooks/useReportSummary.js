import { useMemo } from "react";
import { Package, TrendingUp, Activity, Clock } from "lucide-react";
import { priceParser } from "@/helpers/parser";

export function useReportSummary(inventoryData) {
   // Parse API response for summary statistics
   const summaryStats = useMemo(() => {
      if (!inventoryData) {
         return {
            totalInventoryItems: { count: 0, newItemsThisMonth: 0 },
            totalInventoryVariants: { count: 0, avgValue: 0, newSkusThisMonth: 0 },
            outOfStock: { count: 0, status: "Items requiring immediate restock" },
            stockHealthScore: { score: 0, healthyItems: 0, totalItems: 0, status: "Excellent" },
         };
      }

      return {
         totalInventoryItems: inventoryData.totalInventoryItems || { count: 0, newItemsThisMonth: 0 },
         totalInventoryVariants: inventoryData.totalInventoryVariants || { count: 0, avgValue: 0, newSkusThisMonth: 0 },
         outOfStock: inventoryData.outOfStock || { count: 0, status: "Items requiring immediate restock" },
         stockHealthScore: inventoryData.stockHealthScore || {
            score: 0,
            healthyItems: 0,
            totalItems: 0,
            status: "Excellent",
         },
      };
   }, [inventoryData]);

   const summaryCards = useMemo(
      () => [
         {
            title: "Total Inventory Items",
            value: summaryStats.totalInventoryItems.count.toLocaleString(),
            subtitle: "Number of unique items",
            change: `+${summaryStats.totalInventoryItems.newItemsThisMonth} items this month`,
            icon: Package,
            trend: "up",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            priority: "info",
         },
         {
            title: "Total Inventory Variants",
            value: summaryStats.totalInventoryVariants.count.toLocaleString(),
            subtitle: "Number of unique variants",
            change: `+${summaryStats.totalInventoryVariants.newSkusThisMonth} variants this month`,
            icon: Package,
            trend: "up",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            priority: "info",
         },
         {
            title: "Stock Health Score",
            value: `${summaryStats.stockHealthScore.score}%`,
            subtitle: `${summaryStats.stockHealthScore.healthyItems} items healthy`,
            change: summaryStats.stockHealthScore.status,
            icon: Activity,
            trend: summaryStats.stockHealthScore.status === "Poor" ? "warning" : "up",
            color: summaryStats.stockHealthScore.status === "Poor" ? "text-orange-600" : "text-green-600",
            bgColor: summaryStats.stockHealthScore.status === "Poor" ? "bg-orange-50" : "bg-green-50",
            priority: "medium",
         },
         {
            title: "Out of Stock",
            value: summaryStats.outOfStock.count.toLocaleString(),
            subtitle: summaryStats.outOfStock.status,
            change: summaryStats.outOfStock.count > 0 ? "Action required" : "All stocked",
            icon: Clock,
            trend: summaryStats.outOfStock.count > 0 ? "warning" : "up",
            color: summaryStats.outOfStock.count > 0 ? "text-red-600" : "text-green-600",
            bgColor: summaryStats.outOfStock.count > 0 ? "bg-red-50" : "bg-green-50",
            priority: summaryStats.outOfStock.count > 0 ? "critical" : "low",
         },
      ],
      [summaryStats],
   );

   return { summaryStats, summaryCards };
}
