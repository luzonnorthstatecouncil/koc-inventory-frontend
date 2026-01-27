import * as React from "react";
import { useFormContext } from "react-hook-form";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "../ui/label";

/**
 * Reusable Combobox component with optional useFormContext
 * @param {Array} options - Array of { value, label } objects
 * @param {string} name - Field name for react-hook-form
 * @param {string} value - Selected value (controlled)
 * @param {function} onChange - Callback when value changes
 * @param {string} label - Label for the field
 * @param {boolean} useForm - Whether to use react-hook-form context (default: true)
 * @param {string} placeholder - Placeholder text
 * @param {string} searchPlaceholder - Search input placeholder
 * @param {string} emptyText - Text to show when no results
 * @param {string} className - Additional classes for the button
 * @param {string} contentClassName - Additional classes for the popover content
 */
export default function Combobox({
   options = [],
   name,
   value,
   onChange,
   label,
   useForm = true,
   placeholder = "Select...",
   searchPlaceholder = "Search...",
   emptyText = "No results found.",
   className,
   contentClassName,
   labelClassName = "",
   ...props
}) {
   const formContext = useForm ? useFormContext() : null;
   const setValue = formContext?.setValue;
   const errors = formContext?.formState?.errors || {};
   const error = errors?.[name]?.message;

   const [open, setOpen] = React.useState(false);

   // If using react-hook-form, update the form value
   const handleSelect = (currentValue) => {
      if (useForm && name && setValue) {
         setValue(name, currentValue !== value ? currentValue : "");
         onChange?.(currentValue !== value ? currentValue : "");
      } else {
         onChange?.(currentValue !== value ? currentValue : "");
      }
      setOpen(false);
   };

   // If using react-hook-form, get the current value from context
   const selectedValue = useForm && name && formContext ? formContext.watch(name) : value;

   return (
      <div className='flex flex-col gap-1 w-full'>
         {label && <Label className={labelClassName}>{label}</Label>}
         <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
               <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={open}
                  className={cn("w-[200px] justify-between", className)}
                  type='button'
                  {...props}
               >
                  {selectedValue ? options.find((option) => option.value === selectedValue)?.label : placeholder}
                  <ChevronsUpDownIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
               </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-[200px] p-0", contentClassName)}>
               <Command>
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                     <CommandEmpty>{emptyText}</CommandEmpty>
                     <CommandGroup>
                        {options.map((option) => (
                           <CommandItem key={option.value} value={option.value} onSelect={handleSelect}>
                              <CheckIcon
                                 className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedValue === option.value ? "opacity-100" : "opacity-0"
                                 )}
                              />
                              {option.label}
                           </CommandItem>
                        ))}
                     </CommandGroup>
                  </CommandList>
               </Command>
            </PopoverContent>
         </Popover>
         {error && <p className='text-xs font-medium text-red-500 mt-1 text-start'>{error}</p>}
      </div>
   );
}
