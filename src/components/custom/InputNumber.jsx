import { useFormContext } from "react-hook-form";
import { Minus, Plus } from "lucide-react";
import IButton from "./Button";
import { useCallback } from "react";
import IInput from "./Input";
import Paragraph from "./Paragraph";
import Title from "./Title";
import { cn } from "@/lib/utils";
import { nestedObjParser } from "@/helpers/parser";

export default function InputNumber({
   name,
   disablePrev,
   disableNext,
   max,
   requireMax = false,
   steps = 5,
   disabled = false,
   label,
   inputClassName,
   inputContainerClassName,
   inputWrapperClassName,
}) {
   const {
      setValue,
      watch,
      clearErrors,
      formState: { errors },
   } = useFormContext();
   const rawValue = watch(name);
   const value = Number(rawValue) || 0;
   const fieldErrorObj = nestedObjParser(errors, name);
   const errorMessage = fieldErrorObj?.message;

   const handleIncrement = useCallback(() => {
      if (requireMax && !max) return;
      const newValue = value + steps;
      setValue(name, max ? Math.min(max, newValue) : newValue);
      clearErrors(name);
   }, [name, value, requireMax, max, steps, setValue, clearErrors]);

   const handleDecrement = useCallback(() => {
      if (requireMax && !max) return;
      setValue(name, Math.max(0, value - steps));
      clearErrors(name);
   }, [requireMax, max, setValue, name, value, steps, clearErrors]);

   return (
      <div className={inputWrapperClassName}>
         {label && (
            <Title className='mb-1 font-medium' size='sm'>
               {label}
            </Title>
         )}
         <div
            className={cn(
               "bg-muted border border-outline relative w-max rounded-full p-1 flex items-center",
               inputContainerClassName,
               errorMessage && "border-destructive",
            )}
         >
            <IButton
               disabled={(requireMax && !max) || disabled || disablePrev}
               onClick={handleDecrement}
               aria-label={label ? `Decrease ${label}` : "Decrease"}
               type='button'
               className='bg-white hover:bg-gray-100 text-black border border-outline rounded-full size-10'
            >
               <Minus />
            </IButton>

            <IInput
               name={name}
               aria-label={typeof label === "string" ? label : undefined}
               max={max}
               showError={false}
               disabled={(requireMax && !max) || disabled}
               value={value}
               parse='numeric'
               inputWrapperClassName='bg-muted'
               className={cn(
                  "w-16 text-center border-0 bg-muted text-black font-semibold !outline-0 !ring-0",
                  inputClassName,
               )}
            />

            <IButton
               disabled={(requireMax && !max) || disabled || disableNext}
               onClick={handleIncrement}
               aria-label={label ? `Increase ${label}` : "Increase"}
               type='button'
               className='bg-white hover:bg-gray-100 text-black border border-outline rounded-full size-10'
            >
               <Plus />
            </IButton>
         </div>
         {errorMessage && <p className='text-xs font-medium text-red-500 text-start mt-1'>{errorMessage}</p>}
      </div>
   );
}
