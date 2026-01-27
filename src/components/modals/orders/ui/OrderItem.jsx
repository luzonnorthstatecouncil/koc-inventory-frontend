import DashLine from "@/components/custom/DashLine";
import Paragraph from "@/components/custom/Paragraph";
import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

export default function OrderItem({ name, quantity, price, className, nameClassName, priceClassName, parsePrice = true }) {
   return (
      <div className={cn("flex items-center justify-between gap-2", className)}>
         <Paragraph size='sm' className='flex flex-col max-w-70'>
            <span className={cn("font-semibold text-black", nameClassName)}>
               {quantity ? `${quantity} x` : ""} {name}
            </span>
            {quantity ? priceParser(price) : null}
         </Paragraph>

         <DashLine />

         <Paragraph size='sm' className={priceClassName}>{parsePrice ? priceParser(quantity ? quantity * price : price) : price}</Paragraph>
      </div>
   );
}
