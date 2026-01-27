import PageLayout from "@/layout/PageLayout";
import { AUDIT_LOGS, HOME } from "@/constants/routes";
import DataTable from "@/components/custom/Datatable";
import { dateParser } from "@/helpers/parser";
import { useGetLogsQuery } from "@/features/api/activityLog";
import Paragraph from "@/components/custom/Paragraph";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const breadcrumbItems = [{ label: HOME.title }, { label: AUDIT_LOGS.title }];

const columns = [
   {
      key: "user.full_name",
      title: "User",
      render: (value, item) => (
         <div className='flex items-center gap-3'>
            <Avatar>
               <AvatarImage src={null} />
               <AvatarFallback>
                  {value?.charAt(0).toUpperCase()}
                  {value?.split(" ")[1]?.charAt(0).toUpperCase()}
               </AvatarFallback>
            </Avatar>
            <div>
               <p>{value}</p>
               <Paragraph>{item.user?.email}</Paragraph>
            </div>
         </div>
      ),
   },
   {
      key: "module",
      title: "Module",
   },
   {
      key: "activity_type",
      title: "Action",
   },
   {
      key: "description",
      title: "Description",
   },
   {
      key: "ip_address",
      title: "IP Address",
   },
   {
      key: "created_at",
      title: "Date",
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

export default function AuditLogs() {
   return (
      <PageLayout breadcrumbItems={breadcrumbItems} pageTitle={AUDIT_LOGS.title} route={AUDIT_LOGS}>
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
