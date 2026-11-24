import PageLayout from "@/layout/PageLayout";
import { AUDIT_LOGS } from "@/constants/routes";
import DataTable from "@/components/custom/Datatable";
import { dateParser } from "@/helpers/parser";
import { useGetLogsQuery } from "@/features/api/activityLog";
import { cn } from "@/lib/utils";

const primaryText = "text-sm font-medium text-foreground";
const secondaryText = "text-xs text-neutral-500";

// Colour only for actions that destroy or reverse something; everything else reads as plain history.
const isDestructive = (activity = "") => /delete|remove|void|reject|flush|deactivat/i.test(activity);

const DateCell = ({ value }) => (
   <div className='flex flex-col gap-0.5'>
      <span className={primaryText}>{dateParser(value, "PP")}</span>
      <span className={cn(secondaryText, "tabular-nums")}>{dateParser(value, "p")}</span>
   </div>
);

function ActivityCell({ activity, module }) {
   const destructive = isDestructive(activity);
   return (
      <div className='flex min-w-0 flex-col gap-0.5'>
         <span className={cn("inline-flex min-w-0 items-center gap-2 text-sm font-medium", destructive ? "text-red-700" : "text-foreground")}>
            {destructive && <span className='size-1.5 shrink-0 rounded-full bg-red-500' aria-hidden='true' />}
            <span className='block truncate capitalize'>{activity}</span>
         </span>
         {module && <span className={cn(secondaryText, "block truncate capitalize")}>{module}</span>}
      </div>
   );
}

const columns = [
   {
      key: "created_at",
      title: "Date",
      width: "140px",
      render: (value) => <DateCell value={value} />,
   },
   {
      key: "user.full_name",
      title: "User",
      width: "200px",
      render: (value, item) => (
         <div className='flex min-w-0 flex-col gap-0.5'>
            <span className={cn(primaryText, "block truncate font-semibold")}>{value || "System"}</span>
            <span className={cn(secondaryText, "block truncate")}>{item.user?.email}</span>
         </div>
      ),
   },
   {
      key: "activity_type",
      title: "Activity",
      width: "190px",
      render: (value, item) => <ActivityCell activity={value} module={item.module} />,
   },
   {
      key: "description",
      title: "Description",
      render: (value) => (
         <span className='block max-w-md truncate text-sm text-neutral-700' title={value}>
            {value}
         </span>
      ),
   },
   {
      key: "ip_address",
      title: "IP address",
      width: "140px",
      render: (value) => <span className={cn(secondaryText, "tabular-nums")}>{value || "—"}</span>,
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
