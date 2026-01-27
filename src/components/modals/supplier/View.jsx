import Details from "@/components/custom/Details";
import Title from "@/components/custom/Title";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle } from "lucide-react";

export default function View({ supplier }) {
   if (!supplier) return null;

   return (
      <div className='space-y-4'>
         <div>
            <Title size='2xl' className='mb-1'>
               {supplier.name}
            </Title>
            <p className='text-sm text-muted-foreground'>Supplier Details</p>
         </div>

         <Separator />

         <div className='flex items-center gap-2'>
            {supplier.status ? (
               <>
                  <CheckCircle2 className='size-5 text-green-600' />
                  <Badge variant='success'>Active</Badge>
               </>
            ) : (
               <>
                  <XCircle className='size-5 text-gray-400' />
                  <Badge variant='secondary'>Inactive</Badge>
               </>
            )}
         </div>
      </div>
   );
}
