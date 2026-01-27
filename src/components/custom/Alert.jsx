import { CircleXIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { cn } from "@/lib/utils";

export default function IAlert({ title, description, variant = "destructive", wrapperClassName }) {
   const isError = variant === "destructive";

   return (
      <Alert variant={variant} className={cn(isError ? "border-destructive/40 bg-red-50" : "", wrapperClassName)}>
         {isError && <CircleXIcon className='size-4' />}

         {title && (
            <AlertTitle className='text-start flex items-center gap-1 !font-semibold'>
               <p>{title}</p>
            </AlertTitle>
         )}

         {description && <AlertDescription>{description}</AlertDescription>}
      </Alert>
   );
}
