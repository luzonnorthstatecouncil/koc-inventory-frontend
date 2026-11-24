import { useFormContext, useWatch } from "react-hook-form";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

export default function ICheckbox({ name, label, useForm = true, checked, className, labelClassName, ...props }) {
   // eslint-disable-next-line react-hooks/rules-of-hooks -- `useForm` is fixed for the component's lifetime, so hook order never changes
   const formContext = useForm ? useFormContext() : null;
   const register = formContext?.register || (() => ({}));
   const setValue = formContext?.setValue;
   // eslint-disable-next-line react-hooks/rules-of-hooks -- `useForm` is fixed for the component's lifetime, so hook order never changes
   const watch = formContext ? useWatch({ name }) : null;
   const isChecked = useForm ? watch : checked;

   const handleChange = (value) => {
      if (useForm && name && setValue) {
         setValue(name, value);
      }

      if (props.onChange) {
         props.onChange(value);
      }
   };

   return (
      <div className={cn("flex items-center gap-2", className)}>
         <Checkbox
            id={name}
            checked={isChecked}
            onCheckedChange={handleChange}
            className='cursor-pointer'
            {...(useForm && name ? register(name) : {})}
            {...props}
         />

         <Label className={cn("cursor-pointer", labelClassName)} htmlFor={name}>
            {label}
         </Label>
      </div>
   );
}
