import DataTable from "@/components/custom/Datatable";
import Details from "@/components/custom/Details";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { dateParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";
import { Arrow } from "@radix-ui/react-dropdown-menu";
import { ArrowRight, Barcode, ChevronRight, TrendingDown, TrendingUp, TrendingUpDown } from "lucide-react";

const movementColumns = [
   {
      key: "remarks",
      title: "Remarks",
      width: "250px",
      cellClassName: "text-xs",
      render: (value) => value || "Received stocks",
   },
   {
      key: "reference_no",
      title: "Reference Number",
      cellClassName: "text-xs",
   },
   {
      key: "quantity",
      width: "80px",
      title: "Quantity",
      render: (value, item) => (
         <Paragraph
            size='sm'
            className={cn(
               "font-semibold flex items-center gap-1",
               item?.type === "in" ? "!text-green-600" : item?.type === "out" ? "!text-destructive" : "!text-orange-500"
            )}
         >
            {item?.type === "in" ? (
               <TrendingUp className='size-4' />
            ) : item?.type === "out" ? (
               <TrendingDown className='size-4' />
            ) : (
               <TrendingUpDown className='size-4' />
            )}

            {value}
         </Paragraph>
      ),
   },
   {
      key: "created_at",
      width: "150px",
      title: "Date",
      cellClassName: "text-xs",
      render: (value) => dateParser(value),
   },
];

export default function View({ item }) {
   return (
      <>
         <section className='bg-muted border border-outline p-2 rounded mb-4'>
            <div className='flex items-center gap-2'>
               <Title>{item?.inventory.name} - {item?.variant?.variant_name}</Title>
               <Badge size='sm' variant='default' className='font-mono'>
                  {item?.inventory.sku}
               </Badge>
            </div>
            <Paragraph>{item?.inventory.description}</Paragraph>
         </section>

         <Title className='mb-3 flex items-center gap-1'>
            <Barcode className='size-5' /> {item?.reference_no}
         </Title>

         <section className='grid grid-cols-2 items-start gap-3'>
            <Details label='Batch Quantity' description={item?.batch_quantity} />
            <Details label='Unit' description={<Badge variant='outline'>{item?.inventory.unit}</Badge>} />
            <Details label='Date Added' description={dateParser(item?.received_at)} />
            <Details label='Date Expiration' description={dateParser(item?.expires_at, "PP")} />
            <Details label='Supplier' description={item?.supplier?.name} />
         </section>

         <Separator className='my-3' />

         <DataTable
            title='Stock Movements'
            description='List of ins and outs per batch.'
            wrapperClassName='mt-3'
            columns={movementColumns}
            searchable={false}
            filterable={false}
            serverSide={false}
            tableData={item?.movements || []}
            initialPageSize={5}
            showPageSizeSelector={false}
            tableHeaderClassName='flex items-center justify-between mb-0'
         />
      </>
   );
}
