import Pagination from "@/components/custom/Pagination";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetInventoryAuditTrailsQuery } from "@/features/api/inventory";
import { dateParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { ClipboardList, User } from "lucide-react";
import { useState } from "react";

const CHANGE_TYPE_CONFIG = {
   variant_added:      { label: "Variant Added",   pill: "bg-emerald-50 text-emerald-700",  dot: "bg-emerald-500",  border: "border-l-emerald-400" },
   variant_deleted:    { label: "Variant Deleted", pill: "bg-red-50 text-red-600",          dot: "bg-red-500",      border: "border-l-red-400" },
   variant_updated:    { label: "Variant Updated", pill: "bg-amber-50 text-amber-700",      dot: "bg-amber-400",    border: "border-l-amber-400" },
   inventory_updated:  { label: "Item Updated",    pill: "bg-blue-50 text-blue-700",        dot: "bg-blue-500",     border: "border-l-blue-400" },
   inventory_created:  { label: "Item Created",    pill: "bg-emerald-50 text-emerald-700",  dot: "bg-emerald-500",  border: "border-l-emerald-400" },
   inventory_deleted:  { label: "Item Deleted",    pill: "bg-red-50 text-red-600",          dot: "bg-red-500",      border: "border-l-red-400" },
};

function formatValue(value) {
   if (value === null || value === undefined) return <span className='italic text-muted-foreground'>null</span>;
   return String(value);
}

function normalizeFields(changedFields) {
   if (!changedFields) return null;
   if (Array.isArray(changedFields)) return changedFields;
   try {
      const parsed = JSON.parse(changedFields);
      return Array.isArray(parsed) ? parsed : null;
   } catch {
      return null;
   }
}

function normalizeValues(values) {
   if (!values) return null;
   if (typeof values === "object") return values;
   try {
      const parsed = JSON.parse(values);
      return typeof parsed === "object" && parsed !== null ? parsed : null;
   } catch {
      return null;
   }
}

function ChangeDiff({ changedFields: rawChangedFields, oldValues: rawOldValues, newValues: rawNewValues }) {
   const changedFields = normalizeFields(rawChangedFields);
   const oldValues = normalizeValues(rawOldValues);
   const newValues = normalizeValues(rawNewValues);
   if (!oldValues && !newValues) return null;

   if (!changedFields) {
      const values = newValues ?? oldValues;
      const isAdded = Boolean(newValues);

      return (
         <div className='mt-2 rounded-md border overflow-hidden'>
            <table className='w-full text-xs'>
               <thead>
                  <tr className='bg-muted/60'>
                     <th className='text-left px-3 py-1.5 font-medium text-muted-foreground w-1/3'>Field</th>
                     <th className='text-left px-3 py-1.5 font-medium text-muted-foreground'>
                        {isAdded ? "Value" : "Removed Value"}
                     </th>
                  </tr>
               </thead>
               <tbody>
                  {Object.entries(values).map(([field, value]) => (
                     <tr key={field} className='border-t'>
                        <td className='px-3 py-1.5 text-foreground font-medium capitalize'>
                           {field.replace(/_/g, " ")}
                        </td>
                        <td
                           className={cn(
                              "px-3 py-1.5",
                              isAdded ? "text-green-700 dark:text-green-400" : "text-destructive",
                           )}
                        >
                           {formatValue(value)}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      );
   }

   return (
      <div className='mt-2 rounded-md border overflow-hidden'>
         <table className='w-full text-xs'>
            <thead>
               <tr className='bg-muted/60'>
                  <th className='text-left px-3 py-1.5 font-medium text-muted-foreground w-1/3'>Field</th>
                  <th className='text-left px-3 py-1.5 font-medium text-muted-foreground w-1/3'>Old Value</th>
                  <th className='text-left px-3 py-1.5 font-medium text-muted-foreground w-1/3'>New Value</th>
               </tr>
            </thead>
            <tbody>
               {changedFields?.map((field) => (
                  <tr key={field} className='border-t'>
                     <td className='px-3 py-1.5 text-foreground font-medium capitalize'>{field.replace(/_/g, " ")}</td>
                     <td className='px-3 py-1.5 text-gray-500 line-through'>{formatValue(oldValues?.[field])}</td>
                     <td className='px-3 py-1.5 text-green-700 dark:text-green-400'>
                        {formatValue(newValues?.[field])}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   );
}

function AuditTrailEntry({ entry }) {
   const config = CHANGE_TYPE_CONFIG[entry.change_type] ?? {
      label: entry.change_type,
      pill: "bg-gray-100 text-gray-600",
      dot: "bg-gray-400",
      border: "border-l-gray-300",
   };

   return (
      <div className={cn("border-l-2 pl-4 py-1.5", config.border)}>
         <div className='flex flex-wrap items-center gap-2'>
            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-sm font-semibold", config.pill)}>
               <span className={cn("size-1.5 rounded-full", config.dot)} />
               {config.label}
            </span>
            <span className='text-sm font-semibold text-foreground'>{entry.subject_name}</span>
            <span className='text-xs text-muted-foreground ml-auto shrink-0'>{dateParser(entry.changed_at, "PPp")}</span>
         </div>

         <div className='flex items-center gap-1 mt-1'>
            <User className='size-3 text-muted-foreground' />
            <span className='text-xs text-foreground'>
               {entry.changed_by?.full_name}
               <span className='ml-1 text-muted-foreground'>({entry.changed_by?.email})</span>
            </span>
         </div>

         {config.label !== "Variant Deleted" && config.label !== "Variant Added" && (
            <ChangeDiff
               changedFields={entry.changed_fields}
               oldValues={entry.old_values}
               newValues={entry.new_values}
            />
         )}
      </div>
   );
}

function AuditTrailSkeleton() {
   return (
      <div className='space-y-4'>
         {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='border-l-2 border-l-muted pl-4 py-1 space-y-2'>
               <div className='flex items-center gap-2'>
                  <Skeleton className='h-5 w-24 rounded-md' />
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-4 w-32 ml-auto' />
               </div>
               <Skeleton className='h-4 w-48' />
               <Skeleton className='h-16 w-full rounded-md' />
            </div>
         ))}
      </div>
   );
}

export default function ViewAuditTrails({ item }) {
   const [page, setPage] = useState(1);
   const [pageSize, setPageSize] = useState(10);

   const { data, isLoading, isFetching } = useGetInventoryAuditTrailsQuery(
      { id: item?.id, page, pageSize },
      { skip: !item?.id },
   );

   const trails = data?.data ?? [];
   const pagination = data?.pagination;
   const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

   return (
      <div className='w-full flex flex-col gap-3'>
         <div className='flex items-center gap-2'>
            <div className='p-1.5 bg-primary/10 rounded-lg'>
               <ClipboardList className='size-4 text-primary' />
            </div>
            <div>
               <Title className='text-base font-bold text-foreground leading-tight'>Audit Trails</Title>
               <Paragraph size='sm' className='text-muted-foreground'>Recorded changes to this item and its variants.</Paragraph>
            </div>
         </div>

         <ScrollArea className='h-[340px] pr-2'>
            {isLoading || isFetching ? (
               <AuditTrailSkeleton />
            ) : trails.length === 0 ? (
               <Paragraph size="sm" className='py-4 text-center'>No audit trail records found.</Paragraph>
            ) : (
               <div className='space-y-4'>
                  {trails.map((entry) => (
                     <AuditTrailEntry key={entry.id} entry={entry} />
                  ))}
               </div>
            )}
         </ScrollArea>

         {pagination && totalPages > 1 && (
            <Pagination
               currentPage={page}
               totalPages={totalPages}
               pageSize={pageSize}
               totalCount={pagination.total}
               onPageChange={setPage}
               onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
               }}
               showPageSizeSelector={false}
            />
         )}
      </div>
   );
}
