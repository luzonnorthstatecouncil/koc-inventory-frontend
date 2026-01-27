import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import VariantItem from "@/components/custom/VariantItem";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ViewVariants({ variants }) {
   return (
      <div className='w-full'>
         <Title>Variants</Title>
         <Paragraph className='mb-4 w-3/4'>
            View the different variants of this inventory item. Each variant may have its own stock levels and quantity.
         </Paragraph>

         <ScrollArea className='h-70'>
            {variants && variants.length > 0 ? (
               variants.map((variant) => <VariantItem key={variant.id} variant={variant} />)
            ) : (
               <div className='text-sm text-muted-foreground py-2'>No variants available</div>
            )}
         </ScrollArea>
      </div>
   );
}
