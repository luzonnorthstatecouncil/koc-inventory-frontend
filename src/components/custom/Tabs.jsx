import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AlertCircle, BadgeAlert } from "lucide-react";

export default function ITabs({ defaultValue, items, className, triggerClassName, tabListClassName, onTabChange }) {
   return (
      <div className={cn(className, "flex w-full flex-col gap-4 sm:gap-6")}>
         <Tabs defaultValue={defaultValue} onValueChange={onTabChange}>
            <TabsList className={cn(tabListClassName, "mb-2 overflow-x-auto flex-nowrap justify-start w-full")}>
               {items.map((item) => (
                  <TabsTrigger key={item.value} value={item.value} className={cn(triggerClassName, "relative text-xs sm:text-sm whitespace-nowrap")}>
                     {item.label}
                     {item.hasError && <AlertCircle className='size-3 sm:size-4 text-destructive' />}
                  </TabsTrigger>
               ))}
            </TabsList>
            {items.map((item) => (
               <TabsContent key={item.value} value={item.value}>
                  {item.content}
               </TabsContent>
            ))}
         </Tabs>
      </div>
   );
}
