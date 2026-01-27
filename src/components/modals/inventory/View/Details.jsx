import Details from "@/components/custom/Details";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { dateParser, priceParser } from "@/helpers/parser";
import { Barcode } from "lucide-react";

export default function ViewDetails({ item }) {
   return (
      <div className='w-full'>
         <header className='flex items-end justify-between gap-2'>
            <section>
               <Title className='font-semibold'>{item?.name}</Title>
               <Paragraph size='xs' variant='default' className='mb-0.5'>
                  {item?.sku}
               </Paragraph>
               <Paragraph className='flex items-center gap-1'>
                  <Barcode className='size-3.5' /> Serial Number: {item?.serial_number}
               </Paragraph>
            </section>

            <section className='flex flex-col items-end gap-1'>
               <Badge
                  variant={
                     item?.status === "out of stock" ? "destructive" : item?.status === "active" ? "success" : "default"
                  }
               >
                  {item?.status}
               </Badge>
               <Paragraph size='xs'>
                  Unit Price: <span className='font-semibold text-black'>{priceParser(item.price)}</span>
               </Paragraph>
            </section>
         </header>

         <Separator className='my-3' />

         <div className='grid grid-cols-2 gap-4 mt-5'>
            <Details label='Description' description={item?.description} />
            <Details label='Has Expiration' description={Boolean(item?.has_expiry) ? "Yes" : "No"} />
            <Details label='Date Added' description={dateParser(item?.created_at)} />
            <Details label='Category' description={item?.category.name} />
         </div>

         <Separator className='my-3' />
      </div>
   );
}
