import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useRef } from "react";

export default function Form({
   children,
   onSubmit,
   onFailed,
   schema,
   defaultValues = {},
   mode = "onSubmit",
   debounce = null,
   relatedKeys = {},
   ...props
}) {
   const form = useForm({
      resolver: schema ? zodResolver(schema) : undefined,
      defaultValues,
      mode,
      formState: {
         isSubmitting: false,
         isValidating: false,
         isDirty: false,
         isTouched: false,
         errors: {},
      },
   });

   const debounceRef = useRef(null);
   const previousValuesRef = useRef({});

   useEffect(() => {
      if (!relatedKeys || Object.keys(relatedKeys).length === 0) return;

      if (!previousValuesRef.current) {
         previousValuesRef.current = form.getValues();
      }

      const subscription = form.watch((value, { name }) => {
         if (name && relatedKeys[name]) {
            const currentValue = value[name];
            const previousValue = previousValuesRef.current[name];

            if (currentValue !== previousValue) {
               const fieldsToClear = [relatedKeys[name]].flat();

               fieldsToClear.forEach((relatedField) => {
                  form.setValue(relatedField, "", { shouldDirty: true });
                  form.clearErrors(relatedField);
               });

               previousValuesRef.current[name] = currentValue;
            }
         }
      });

      return () => subscription.unsubscribe();
   }, [relatedKeys, form]);

   // Debounced submit
   useEffect(() => {
      if (!debounce) return;

      const subscription = form.watch(() => {
         if (debounceRef.current) clearTimeout(debounceRef.current);

         debounceRef.current = setTimeout(() => {
            form.handleSubmit(onSubmit)();
         }, debounce * 1000);
      });

      return () => {
         subscription.unsubscribe();
         if (debounceRef.current) clearTimeout(debounceRef.current);
      };
   }, [debounce, form, onSubmit]);

   // Call onFailed on errors
   useEffect(() => {
      if (Object.keys(form.formState.errors).length > 0) {
         onFailed?.(form.formState.errors);
      }
   }, [form.formState.errors, onFailed]);

   const clearErrors = () => {
      form.clearErrors();
      onFailed?.({});
   };

   const handleSubmit = (e) => {
      e.preventDefault();
      clearErrors();
      form.handleSubmit(onSubmit)(e);
   };

   const handleOnChange = (e) => {
      clearErrors();
      form.handleSubmit(onSubmit)(e);
   };

   return (
      <FormProvider {...form}>
         <form
            className={`w-full ${props.className}`}
            noValidate
            {...(debounce == null &&
               mode === "onSubmit" && {
                  onSubmit: handleSubmit,
               })}
            {...(debounce == null &&
               mode === "onChange" && {
                  onChange: handleOnChange,
               })}
            {...props}
         >
            {typeof children === "function" ? children(form) : children}
         </form>
      </FormProvider>
   );
}
