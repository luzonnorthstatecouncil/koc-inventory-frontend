import { useFormContext } from "react-hook-form";
import { FORM } from "@/constants/message";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useState } from "react";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { Textarea } from "../ui/textarea";

export default function ITextarea({
   name,
   prefix,
   suffix,
   label,
   emptyMessage = FORM.REQUIRED,
   preventEnterSubmit = false,
   useForm = true,
   wrapperClassName = "",
   labelClassName = "",
   ...props
}) {
   const formContext = useForm ? useFormContext() : null;
   const register = formContext?.register || (() => ({}));
   const errors = formContext?.formState?.errors || {};

   const error = errors?.[name]?.message;
   const isPassword = props.type === "password";
   const isLoading = useSelector((state) => state.loading.isLoading);
   const [passwordVisible, setPasswordVisible] = useState(false);

   const preventSubmit = (e) => {
      if (e.key === "Enter" && preventEnterSubmit) {
         e.preventDefault();
      }
   };

   return (
      <div className={`flex flex-col gap-1 w-full ${wrapperClassName}`}>
         {label && <Label className={labelClassName}>{label}</Label>}

         <div className='relative w-full bg-white'>
            {prefix && (
               <span className='absolute top-1/2 left-3 -translate-y-1/2 text-primary-foreground'>{prefix}</span>
            )}

            <Textarea
               {...(useForm && name ? register(name) : {})}
               {...props}
               type={isPassword && !passwordVisible ? "password" : isPassword ? "text" : props.type}
               className={`w-full bg-white border border-outline text-black ${prefix ? "pl-9.5" : ""} ${
                  suffix ? "pr-9.5" : ""
               } ${props.className}`}
               aria-invalid={!!error}
               aria-errormessage={error || emptyMessage}
               disabled={isLoading || props.disabled}
               onKeyDown={preventSubmit}
               variant='secondary'
               maxLength={255}
            />

            {suffix && !isPassword && <span className='absolute top-1/2 right-3 -translate-y-1/2'>{suffix}</span>}

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

         {error && <p className='text-xs font-medium text-red-500 text-start'>{error}</p>}
      </div>
   );
}
