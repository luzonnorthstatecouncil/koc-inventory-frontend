import Modal from "@/components/custom/Modal";
import DataTable from "@/components/custom/Datatable";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Paragraph from "@/components/custom/Paragraph";
import { useGetAllStockApprovalsQuery } from "@/features/api/inventory";
import { padwithZero } from "@/helpers/parser";

const columns = [
   {
      key: "id",
      title: "ID",
      width: "80px",
      render: (value) => padwithZero(value),
   },
   {
      key: "variant.inventory.name",
      title: "Product",
      width: "200px",
      cellClassName: "font-medium",
      render: (value, item) => (
         <div className='flex flex-col'>
            <Paragraph size='sm' variant='default'>
               {value} - {item.variant?.variant_name}
            </Paragraph>
            <Paragraph size='xs' variant='muted'>
               {item.variant?.inventory?.sku}
            </Paragraph>
         </div>
      ),
   },
   {
      key: "quantity",
      title: "Quantity",
      width: "170px",
      render: (value, item) => (
         <div>
            <Paragraph
               size='sm'
               className='font-semibold'
               variant={item.request_type === "remove" ? "danger" : "success"}
            >
               {item.request_type === "remove" ? "-" : "+"}
               {value} {item.variant?.inventory?.unit}
            </Paragraph>
            <Paragraph>from {item.supplier?.name}</Paragraph>
         </div>
      ),
   },
   {
      key: "approved_at",
      title: "Status",
      width: "100px",
      render: (value, item) => {
         const isApproved = Boolean(value) && !item.rejection_reason;
         const isRejected = Boolean(item.rejection_reason);

         return (
            <Badge variant={isApproved ? "success" : isRejected ? "destructive" : "warning"}>
               {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending"}
            </Badge>
         );
      },
   },
   {
      key: "created_at",
      title: "Date Requested",
      width: "150px",
      render: (value) => (value ? format(new Date(value), "PPp") : "-"),
   },
   {
      key: "rejection_reason",
      title: "Remarks",
      width: "150px",
      render: (value, item) => (item.status === "pending" ? item.reason : value || "-"),
   },
];

export default function UserStockRequests({ isOpen, onClose, userId, userName }) {
   return (
      <div>
         <DataTable
            query={{
               useQuery: useGetAllStockApprovalsQuery,
               options: {
                  refetchOnMountOrArgChange: true,
               },
            }}
            columns={columns}
            searchable={false}
            filterable={false}
            paginated={true}
            initialPageSize={10}
            showPageSizeSelector={false}
            emptyMessage='No stock requests found'
         />
      </div>
   );
}
