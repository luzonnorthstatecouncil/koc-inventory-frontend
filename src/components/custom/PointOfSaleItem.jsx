import { ShoppingCart } from "lucide-react";
import { Separator } from "../ui/separator";
import IButton from "./Button";
import ICard from "./Card";
import Paragraph from "./Paragraph";
import Title from "./Title";
import { useMemo } from "react";
import { priceParser } from "@/helpers/parser";
import { cn } from "@/lib/utils";

export default function PointOfSaleItem(props) {
   const stockLevel = useMemo(() => {
      return props.current_qty < props.reorder_level
         ? "!text-red-500"
         : props.current_qty > props.safe_qty_level
           ? "!text-green-500"
           : "!text-gray-500";
   }, [props.current_qty, props.reorder_level, props.safe_qty_level]);

   return (
      <ICard
         cardClassName={cn(
            "transition-colors duration-300 group bg-card w-full md:w-55 lg:w-57 h-36 sm:h-40 p-2 sm:p-3 border-outline",
            props.included ? "border-l-3 border-l-emphasis bg-white!" : "hover:border-primary",
         )}
         cardContentClassName='flex flex-col h-full p-0'
      >
         <main className='flex items-start gap-2 mb-2 sm:mb-3'>
            <label className='w-full h-full flex flex-col justify-start items-start'>
               <Title
                  size='sm'
                  className='select-none mb-0.5 sm:mb-1 leading-4 sm:leading-5 line-clamp-2 sm:line-clamp-3'
               >
                  {props.name}
               </Title>
               <Paragraph className='text-gray-600 !font-medium text-xs sm:text-sm'>{props.sku}</Paragraph>
            </label>
         </main>
         <section className='mt-auto flex items-center justify-between w-full pt-2'>
            <span>
               <Title size='xs' className='sm:text-sm'>
                  {priceParser(props.price)}
               </Title>
               <Paragraph className={`font-medium text-xs sm:text-sm ${stockLevel}`}>
                  Stocks: {props.current_qty}
               </Paragraph>
            </span>
            <IButton
               variant='default'
               className='flex items-center gap-1 sm:gap-2 text-xs border border-outline px-2 sm:px-3'
               onClick={props.onClick}
            >
               <ShoppingCart className='size-3 sm:size-3.5' /> <span className='hidden sm:inline'>Add to Cart</span>
               <span className='sm:hidden'>Add</span>
            </IButton>
         </section>
      </ICard>
   );
}
