import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function ICard({
   children,
   title,
   description,
   cardAction,
   cardClassName = "",
   cardContentClassName = "",
   cardTitleClassName = "",
   cardHeaderClassName = "",
   onClick,
}) {
   return (
      <Card className={`w-full border-outline ${cardClassName}`} onClick={onClick}>
         {title && (
            <CardHeader className={cn('gap-1', cardHeaderClassName)}>
               <CardTitle className={cn("text-lg sm:text-xl md:text-2xl font-bold", cardTitleClassName)}>{title}</CardTitle>
               <CardDescription>{description}</CardDescription>
               <CardAction>{cardAction}</CardAction>
            </CardHeader>
         )}
         <CardContent className={cardContentClassName}>{children}</CardContent>
      </Card>
   );
}
