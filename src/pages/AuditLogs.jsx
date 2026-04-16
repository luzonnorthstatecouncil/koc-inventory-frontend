import PageLayout from "@/layout/PageLayout";
import { AUDIT_LOGS, HOME } from "@/constants/routes";
import DataTable from "@/components/custom/Datatable";
import { dateParser } from "@/helpers/parser";
import { useGetLogsQuery } from "@/features/api/activityLog";
import { CalendarDays, Network } from "lucide-react";

const breadcrumbItems = [{ label: HOME.title }, { label: AUDIT_LOGS.title }];

const ACTION_STYLES = {
   create: "bg-emerald-50 text-emerald-700",
   update: "bg-blue-50 text-blue-700",
   delete: "bg-red-50 text-red-600",
   view: "bg-gray-100 text-gray-600",
   login: "bg-violet-50 text-violet-700",
   logout: "bg-orange-50 text-orange-700",
};

function avatarColor(name = "") {
   const palette = [
      "bg-rose-100 text-rose-700",
      "bg-orange-100 text-orange-700",
      "bg-amber-100 text-amber-700",
      "bg-emerald-100 text-emerald-700",
      "bg-cyan-100 text-cyan-700",
      "bg-blue-100 text-blue-700",
      "bg-violet-100 text-violet-700",
      "bg-pink-100 text-pink-700",
   ];
   let hash = 0;
   for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
   return palette[Math.abs(hash) % palette.length];
}

function moduleColor(mod = "") {
   const palette = [
      "bg-sky-50 text-sky-700",
      "bg-teal-50 text-teal-700",
      "bg-indigo-50 text-indigo-700",
      "bg-fuchsia-50 text-fuchsia-700",
      "bg-lime-50 text-lime-700",
      "bg-amber-50 text-amber-700",
      "bg-rose-50 text-rose-700",
      "bg-cyan-50 text-cyan-700",
   ];
   let hash = 0;
   for (let i = 0; i < mod.length; i++) hash = mod.charCodeAt(i) + ((hash << 5) - hash);
   return palette[Math.abs(hash) % palette.length];
}

const columns = [
   {
      key: "user.full_name",
      title: "User",
      render: (value, item) => {
         const initials = `${value?.charAt(0) ?? ""}${value?.split(" ")[1]?.charAt(0) ?? ""}`.toUpperCase();
         return (
            <div className='flex items-center gap-3'>
               <div
                  className={`flex-shrink-0 size-8 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(value)}`}
               >
                  {initials}
               </div>
               <div className='min-w-0'>
                  <p className='font-semibold text-sm text-foreground leading-tight truncate'>{value}</p>
                  <p className='text-sm text-muted-foreground truncate'>{item.user?.email}</p>
               </div>
            </div>
         );
      },
   },
   {
      key: "module",
      title: "Module",
      render: (value) => (
         <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${moduleColor(value)}`}
         >
            {value}
         </span>
      ),
   },
   {
      key: "activity_type",
      title: "Action",
      render: (value) => {
         const style = ACTION_STYLES[value?.toLowerCase()] ?? "bg-gray-100 text-gray-600";
         return (
            <span
               className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${style}`}
            >
               {value}
            </span>
         );
      },
   },
   {
      key: "description",
      title: "Description",
      render: (value) => (
         <p className='text-sm text-muted-foreground max-w-60 truncate' title={value}>
            {value}
         </p>
      ),
   },
   {
      key: "ip_address",
      title: "IP Address",
      render: (value) => (
         <span className='inline-flex items-center gap-1.5 font-mono text-xs text-foreground bg-gray-100 px-2 py-0.5 rounded-md'>
            <Network className='size-3 text-muted-foreground' />
            {value}
         </span>
      ),
   },
   {
      key: "created_at",
      title: "Date",
      render: (value) => (
         <span className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'>
            <CalendarDays className='size-3.5' />
            {dateParser(value)}
         </span>
      ),
   },
];

const stockFilters = [
   {
      key: "received_at",
      label: "Date Range",
      type: "date",
   },
];

export default function AuditLogs() {
   return (
      <PageLayout
         breadcrumbItems={breadcrumbItems}
         pageTitle={AUDIT_LOGS.title}
         pageDescription='View and manage audit logs for tracking user activities and system events.'
         route={AUDIT_LOGS}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetLogsQuery,
                  options: {
                     refetchOnMountOrArgChange: true,
                  },
               }}
               columns={columns}
               wrapperClassName='mt-2'
               filterable
               filters={stockFilters}
            />
         </main>
      </PageLayout>
   );
}
