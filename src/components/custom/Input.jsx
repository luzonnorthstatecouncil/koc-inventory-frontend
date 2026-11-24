import { useFormContext } from "react-hook-form";
import { FORM } from "@/constants/message";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useId, useState } from "react";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { nestedObjParser } from "@/helpers/parser";
import {
   ALPHABETS_ONLY,
   ALPHANUMERIC_ONLY,
   NUMERIC_ONLY,
   PRICE_INPUT,
   REFERENCE_NUMBER_INPUT,
} from "@/constants/regex";
import { cn } from "@/lib/utils";
import Paragraph from "./Paragraph";

export default function IInput({
   name,
   prefix,
   suffix,
   label,
   description,
   emptyMessage = FORM.REQUIRED,
   preventEnterSubmit = false,
   useForm = true,
   relatedKeys = [],
   relatedErrorKeys = [],
   wrapperClassName = "",
   labelClassName = "",
   inputWrapperClassName,
   parse,
   parseFormat,
   showError = true,
   ...props
}) {
   // eslint-disable-next-line react-hooks/rules-of-hooks -- `useForm` is fixed for the component's lifetime, so hook order never changes
   const formContext = useForm ? useFormContext() : null;
   const register = formContext?.register || (() => ({}));
   const errors = formContext?.formState?.errors || {};
   const setValue = formContext?.setValue;
   const clearErrors = formContext?.clearErrors;

   const fieldErrorObj = nestedObjParser(errors, name);
   const error = fieldErrorObj?.message;
   const isPassword = props.type === "password";
   // Links the visible label to the input (screen readers, click-to-focus)
   const autoId = useId();
   const inputId = props.id || autoId;
   const isLoading = useSelector((state) => state.loading.isLoading);
   const [passwordVisible, setPasswordVisible] = useState(false);

   const preventSubmit = (e) => {
      if (e.key === "Enter" && preventEnterSubmit) {
         e.preventDefault();
      }

      if (formContext && relatedKeys.length > 0) {
         relatedKeys.forEach((key) => {
            setValue?.(key, "");
         });
         clearErrors?.(relatedKeys);
      }

      if (formContext && relatedErrorKeys.length > 0) {
         relatedErrorKeys.forEach((key) => {
            clearErrors?.(key);
         });
      }
   };

   return (
      <div className={`flex flex-col gap-1 w-full ${wrapperClassName}`}>
         {label && (
            <Label htmlFor={inputId} className={labelClassName}>
               {label}
            </Label>
         )}

         {description && <Paragraph>{description}</Paragraph>}

         <div className={cn("relative w-full", inputWrapperClassName)}>
            {prefix && (
               <span className='absolute top-1/2 left-3 -translate-y-1/2 text-primary-foreground'>
                  {prefix}
               </span>
            )}

            <Input
               id={inputId}
               {...(useForm && name
                  ? register(name, {
                       valueAsNumber:
                          props.type === "number" || parse === "numeric" || parse === "price",
                    })
                  : {})}
               {...props}
               type={isPassword && !passwordVisible ? "password" : isPassword ? "text" : props.type}
               aria-invalid={!!error && showError}
               aria-errormessage={(error || emptyMessage) && showError}
               disabled={isLoading || props.disabled}
               onKeyDown={preventSubmit}
               variant='secondary'
               maxLength={props.maxLength || 35}
               className={cn(
                  "w-full bg-white border border-outline text-black shadow-none!",
                  Boolean(prefix) && "!pl-9",
                  Boolean(suffix) && "!pr-9",
                  props.className,
               )}
               onInput={(e) => {
                  if (parse === "price") {
                     const cleaned = e.target.value.replace(PRICE_INPUT, "");
                     e.target.value = cleaned;
                  } else if (props.type === "number" || parse === "numeric") {
                     const cleaned = e.target.value.replace(NUMERIC_ONLY, "");
                     e.target.value = parseInt(cleaned) || 0;
                  } else if (parse === "uppercase") {
                     e.target.value = e.target.value.toUpperCase();
                  } else if (parse === "lowercase") {
                     e.target.value = e.target.value.toLowerCase();
                  } else if (parse === "alpha") {
                     const cleaned = e.target.value.replace(ALPHABETS_ONLY, "");
                     e.target.value = cleaned;
                  } else if (parse === "alphanumeric") {
                     const cleaned = e.target.value.replace(ALPHANUMERIC_ONLY, "");
                     e.target.value = cleaned;
                  } else if (parse === "reference_no") {
                     const cleaned = e.target.value.replace(REFERENCE_NUMBER_INPUT, "");
                     e.target.value = cleaned.toUpperCase();
                  } else if (parseFormat) {
                     const cleaned = e.target.value.replace(parseFormat, "");
                     e.target.value = cleaned;
                  }

                  if (props.max) {
                     e.target.value = Math.min(e.target.value, props.max);
                  }
               }}
            />

            {suffix && !isPassword && (
               <span className='absolute top-1/2 right-3 -translate-y-1/2'>{suffix}</span>
            )}

            {isPassword &&
               (passwordVisible ? (
                  <EyeClosedIcon
                     className={`${
                        isLoading ? "pointer-events-none" : ""
                     } absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer size-4.5 select-none text-gray-500`}
                     onClick={() => setPasswordVisible(!passwordVisible)}
                  />
               ) : (
                  <EyeIcon
                     className={`${
                        isLoading ? "pointer-events-none" : ""
                     } absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer size-4.5 select-none text-gray-500`}
                     onClick={() => setPasswordVisible(!passwordVisible)}
                  />
               ))}
         </div>

         {showError && error && (
            <p className='text-xs font-medium text-red-500 text-start'>{error}</p>
         )}
      </div>
   );
}
