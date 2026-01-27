import { useFormContext } from "react-hook-form";
import {
   Select,
   SelectContent,
   SelectGroup,
   SelectItem,
   SelectLabel,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { useCallback, useMemo } from "react";
import { nestedObjParser } from "@/helpers/parser";

const ISelect = ({
   options = [],
   value,
   onValueChange,
   name,
   label,
   showAll = true,
   allLabel = "All",
   allValue = "all",
   disabled = false,
   className,
   triggerClassName,
   contentClassName,
   arrowColor,
   error,
   required = false,
   labelAsNull = false,
   useForm = true,
   relatedKeys = [],
   relatedErrorKeys = [],
   ...props
}) => {
   const formContext = useForm ? useFormContext() : null;
   const register = formContext?.register || (() => ({}));
   const setValue = formContext?.setValue;
   const clearErrors = formContext?.clearErrors;
   const errors = formContext?.formState?.errors || {};

   const fieldErrorObj = nestedObjParser(errors, name);
   const fieldError = fieldErrorObj?.message;

   // If using react-hook-form, get the current value from context
   const selectedValue = useForm && name && formContext ? formContext.watch(name) ?? "" : value ?? "";

   // If using react-hook-form, update the form value
   const handleChange = useCallback(
      (val) => {
         const fullOption = options.find((opt) => (opt?.value || opt) === val);

         if (useForm && name && setValue) {
            clearErrors?.(name);
            setValue(name, val ?? "");
            onValueChange?.(fullOption);
         } else {
            onValueChange?.(fullOption);
         }

         if (useForm && formContext && relatedKeys.length > 0) {
            relatedKeys.forEach((key) => {
               setValue?.(key, "");
            });
            clearErrors?.(relatedKeys);
         }

         if (useForm && formContext && relatedErrorKeys.length > 0) {
            relatedErrorKeys.forEach((key) => {
               clearErrors?.(key);
            });
         }
      },
      [useForm, name, setValue, onValueChange, options]
   );

   // Dynamically get label for selected value
   const selectedDisplayValue = useMemo(() => {
      if (selectedValue) {
         const found = options.find((opt) => {
            if (typeof opt === "string") return opt == selectedValue;
            return opt.value == selectedValue;
         });

         return typeof found === "string" ? found : found?.label;
      }

      return props.placeholder ?? "Select an option";
   }, [selectedValue, options]);

   return (
      <div className={cn("flex flex-col gap-1", className)}>
         {label && <Label>{label}</Label>}

         <Select
            {...(useForm && name ? register(name) : {})}
            value={selectedValue}
            onValueChange={handleChange}
            disabled={disabled}
            {...props}
         >
            <SelectTrigger
               className={cn(
                  "w-full cursor-pointer [&>svg]:text-current border-outline bg-white",
                  arrowColor && `[&>svg]:text-${arrowColor}`,
                  fieldError && "border-red-500 focus:ring-red-500",
                  triggerClassName
               )}
            >
               <SelectValue placeholder={selectedDisplayValue} />
            </SelectTrigger>

            <SelectContent className={cn("max-h-48", contentClassName)}>
               <SelectGroup>
                  {label && <SelectLabel>{label}</SelectLabel>}

                  {/* Show "All" option if enabled */}
                  {showAll && (
                     <SelectItem value={allValue}>
                        {labelAsNull ? props.placeholder ?? "Select an option" : allLabel}
                     </SelectItem>
                  )}

                  {/* Render provided options */}
                  {options?.length > 0 ? (
                     options.map((option, index) => (
                        <SelectItem
                           key={`${option?.value || option}-${index}`}
                           value={option?.value || option}
                           className='cursor-pointer'
                        >
                           {option?.label || option}
                        </SelectItem>
                     ))
                  ) : (
                     <SelectItem value='no-options' disabled className='cursor-not-allowed text-gray-400'>
                        No options available
                     </SelectItem>
                  )}
               </SelectGroup>
            </SelectContent>
         </Select>

         {/* Error message */}
         {fieldError && <span className='text-xs text-red-500'>{fieldError}</span>}
      </div>
   );
};

export default ISelect;
