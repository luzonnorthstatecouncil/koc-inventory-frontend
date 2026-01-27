import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Each from "./Each";
import ITooltip from "./Tooltip";

export default function IRadioGroup({
   value = null,
   options,
   iconAsLabel = false,
   className,
   itemClassName,
   iconClassName,
   onChange,
   checkedClassName,
}) {
   return (
      <RadioGroup value={value} className={className} onValueChange={onChange}>
         <Each
            of={options}
            noFallback
            render={(option, index) => (
               <span key={index} className='w-full'>
                  <RadioGroupItem
                     disabled={option.disabled}
                     className={iconAsLabel ? "hidden" : ""}
                     value={option.value}
                     id={`r${index + 1}`}
                  />
                  <ITooltip className='flex items-center gap-3 w-full!' label={option.label} placement='top'>
                     <Label
                        htmlFor={`r${index + 1}`}
                        className={`flex items-center gap-3 w-full ${itemClassName} ${
                           option.value === value ? checkedClassName : ""
                        } ${option.disabled ? "opacity-30 pointer-events-none" : ""}`}
                     >
                        <option.icon strokeWidth={1.5} className={iconClassName} />
                        <span>{option.label}</span>
                     </Label>
                  </ITooltip>
               </span>
            )}
         />
      </RadioGroup>
   );
}
