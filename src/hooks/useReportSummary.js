import { useMemo } from "react";
import { Package, TrendingUp, Activity, Clock } from "lucide-react";
import { priceParser } from "@/helpers/parser";

export function useReportSummary(inventoryData) {
   // Parse API response for summary statistics
   const summaryStats = useMemo(() => {
      if (!inventoryData) {
         return {
            totalInventoryItems: { count: 0, avgValue: 0, newSkusThisMonth: 0 },
            outOfStock: { count: 0, status: "Items requiring immediate restock" },
            stockHealthScore: { score: 0, healthyItems: 0, totalItems: 0, status: "Excellent" },
            totalInventoryValue: { totalValue: 0, cost: 0, itemsNeedReorder: 0 },
         };
      }

      return {
         totalInventoryItems: inventoryData.totalInventoryItems || { count: 0, avgValue: 0, newSkusThisMonth: 0 },
         outOfStock: inventoryData.outOfStock || { count: 0, status: "Items requiring immediate restock" },
         stockHealthScore: inventoryData.stockHealthScore || {
            score: 0,
            healthyItems: 0,
            totalItems: 0,
            status: "Excellent",
         },
         totalInventoryValue: inventoryData.totalInventoryValue || { totalValue: 0, cost: 0, itemsNeedReorder: 0 },
      };
   }, [inventoryData]);

   // Neutral cards; `tone` colours only the note, and only when it needs attention
   const summaryCards = useMemo(() => {
      const items = summaryStats.totalInventoryItems;
      const value = summaryStats.totalInventoryValue;
      const health = summaryStats.stockHealthScore;
      const out = summaryStats.outOfStock;
      // The API has sent both spellings; missing means none, not "undefined"
      const newThisMonth = Number(items.newItemsThisMonth ?? items.newSkusThisMonth ?? 0);
      const needReorder = Number(value.itemsNeedReorder ?? 0);
      const outCount = Number(out.count ?? 0);

      return [
         {
            title: "Total inventory items",
            value: Number(items.count ?? 0).toLocaleString(),
            subtitle: "Unique items and variants",
            note: `+${newThisMonth.toLocaleString()} this month`,
            icon: Package,
         },
         {
            title: "Total Inventory Value",
            value: priceParser(value.totalValue),
            subtitle: "Value of everything in stock",
            note: needReorder > 0 ? `${needReorder.toLocaleString()} items need reorder` : "Nothing needs reorder",
            tone: needReorder > 10 ? "warning" : "default",
            icon: TrendingUp,
         },
         {
            title: "Stock health",
            value: `${health.score ?? 0}%`,
            subtitle: `${Number(health.healthyItems ?? 0).toLocaleString()} of ${Number(health.totalItems ?? 0).toLocaleString()} items healthy`,
            note: health.status,
            tone: health.status === "Poor" ? "warning" : "good",
            icon: Activity,
         },
         {
            title: "Out of stock",
            value: outCount.toLocaleString(),
            subtitle: outCount > 0 ? "Items to restock now" : "Every item has stock",
            note: outCount > 0 ? "Action required" : "All stocked",
            tone: outCount > 0 ? "danger" : "good",
            icon: Clock,
         },
      ];
   }, [summaryStats]);

   return { summaryStats, summaryCards };
}
