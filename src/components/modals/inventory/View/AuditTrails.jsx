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

// Neutral by default; red only marks destructive changes.
const CHANGE_TYPE_CONFIG = {
   variant_added: { label: "Variant added", destructive: false },
   variant_deleted: { label: "Variant deleted", destructive: true },
   variant_updated: { label: "Variant updated", destructive: false },
   inventory_updated: { label: "Item updated", destructive: false },
   inventory_created: { label: "Item created", destructive: false },
   inventory_deleted: { label: "Item deleted", destructive: true },
};

function formatValue(value) {
   if (value === null || value === undefined) return <span className='italic text-neutral-500'>null</span>;
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
         <div className='mt-2 overflow-hidden rounded-lg border border-neutral-200'>
            <table className='w-full text-xs'>
               <thead>
                  <tr className='bg-neutral-50'>
                     <th className='text-left px-3 py-1.5 font-medium text-neutral-500 w-1/3'>Field</th>
                     <th className='text-left px-3 py-1.5 font-medium text-neutral-500'>
                        {isAdded ? "Value" : "Removed Value"}
                     </th>
                  </tr>
               </thead>
               <tbody>
                  {Object.entries(values).map(([field, value]) => (
                     <tr key={field} className='border-t border-neutral-200'>
                        <td className='px-3 py-1.5 text-foreground font-medium capitalize'>
                           {field.replace(/_/g, " ")}
                        </td>
                        <td
                           className={cn(
                              "px-3 py-1.5",
                              isAdded ? "text-foreground" : "text-neutral-500 line-through",
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
      <div className='mt-2 overflow-hidden rounded-lg border border-neutral-200'>
         <table className='w-full text-xs'>
            <thead>
               <tr className='bg-neutral-50'>
                  <th className='text-left px-3 py-1.5 font-medium text-neutral-500 w-1/3'>Field</th>
                  <th className='text-left px-3 py-1.5 font-medium text-neutral-500 w-1/3'>Old Value</th>
                  <th className='text-left px-3 py-1.5 font-medium text-neutral-500 w-1/3'>New Value</th>
               </tr>
            </thead>
            <tbody>
               {changedFields?.map((field) => (
                  <tr key={field} className='border-t border-neutral-200'>
                     <td className='px-3 py-1.5 text-foreground font-medium capitalize'>{field.replace(/_/g, " ")}</td>
                     <td className='px-3 py-1.5 text-neutral-500 line-through'>{formatValue(oldValues?.[field])}</td>
                     <td className='px-3 py-1.5 font-medium text-foreground'>
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
      destructive: false,
   };

   return (
      <li className='px-4 py-3'>
         <div className='flex items-start justify-between gap-4'>
            <div className='flex min-w-0 flex-col gap-0.5'>
               <span
                  className={cn(
                     "inline-flex items-center gap-2 text-xs font-medium",
                     config.destructive ? "text-red-700" : "text-neutral-500",
                  )}
               >
                  <span
                     className={cn("size-2 rounded-full", config.destructive ? "bg-red-500" : "bg-neutral-300")}
                     aria-hidden='true'
                  />
                  {config.label}
               </span>
               <span className='truncate text-sm font-medium text-foreground'>{entry.subject_name}</span>
               <span className='inline-flex items-center gap-1 text-xs text-neutral-500'>
                  <User className='size-3' aria-hidden='true' />
                  {entry.changed_by?.full_name}
                  <span className='text-neutral-500'>({entry.changed_by?.email})</span>
               </span>
            </div>
            <div className='flex shrink-0 flex-col items-end gap-0.5'>
               <span className='text-sm font-medium text-foreground'>{dateParser(entry.changed_at, "PP")}</span>
               <span className='text-xs text-neutral-500 tabular-nums'>{dateParser(entry.changed_at, "p")}</span>
            </div>
         </div>

         {config.label !== "Variant deleted" && config.label !== "Variant added" && (
            <ChangeDiff
               changedFields={entry.changed_fields}
               oldValues={entry.old_values}
               newValues={entry.new_values}
            />
         )}
      </li>
   );
}

function AuditTrailSkeleton() {
   return (
      <div className='space-y-4'>
         {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='space-y-2 border-b border-neutral-200 px-4 py-3 last:border-b-0'>
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
         <div className='flex items-start gap-2'>
            <ClipboardList className='mt-1 size-4 shrink-0 text-neutral-400' aria-hidden='true' />
            <div>
               <Title className='text-base font-bold text-foreground leading-tight'>Audit Trails</Title>
               <Paragraph size='sm' className='text-neutral-500'>Recorded changes to this item and its variants.</Paragraph>
            </div>
         </div>

         <ScrollArea className='h-85 pr-2'>
            {isLoading || isFetching ? (
               <AuditTrailSkeleton />
            ) : trails.length === 0 ? (
               <Paragraph size="sm" className='py-4 text-center'>No audit trail records found.</Paragraph>
            ) : (
               <ul className='divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white'>
                  {trails.map((entry) => (
                     <AuditTrailEntry key={entry.id} entry={entry} />
                  ))}
               </ul>
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
