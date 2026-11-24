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
import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { nestedObjParser } from "@/helpers/parser";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

const SelectAsync = ({
   // RTK Query integration
   query,

   // Static options (fallback if no query)
   options: staticOptions = [],

   value,
   onValueChange,
   name,
   label,
   description,
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
   // Additional query params
   searchable = false,
   searchPlaceholder = "Search...",
   pageSize = 20,
   fallbackLabel,
   ...props
}) => {
   // eslint-disable-next-line react-hooks/rules-of-hooks -- `useForm` is fixed for the component's lifetime, so hook order never changes
   const formContext = useForm ? useFormContext() : null;
   const register = formContext?.register || (() => ({}));
   const setValue = formContext?.setValue;
   const clearErrors = formContext?.clearErrors;
   const errors = formContext?.formState?.errors || {};

   const [isOpen, setIsOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");
   const [currentPage, setCurrentPage] = useState(1);
   const [allOptions, setAllOptions] = useState([]);

   const scrollRef = useRef(null);
   const observerRef = useRef(null);
   const loadMoreTriggerRef = useRef(null);
   const prevDataRef = useRef([]);

   const debouncedSearchTerm = useDebounce(searchTerm, 300);

   const fieldErrorObj = nestedObjParser(errors, name);
   const fieldError = fieldErrorObj?.message;

   // RTK Query integration
   const {
      data: serverData,
      isLoading,
      isFetching,
   } = query?.useQuery
      ? query.useQuery(
           {
              ...query?.params,
              page: currentPage,
              pageSize: pageSize,
              search: searchable ? debouncedSearchTerm : undefined,
           },
           {
              refetchOnMountOrArgChange: true,
              skip: !query?.useQuery,
              ...query?.options,
           },
        )
      : {};

   // Merge paginated data
   useEffect(() => {
      if (!serverData) return;

      // Handle different response structures
      // Could be: { data: [...] } or just [...]
      const responseData = Array.isArray(serverData) ? serverData : serverData.data;

      if (responseData && Array.isArray(responseData)) {
         setAllOptions((prev) => {
            // Reset if it's a new search or first page
            if (currentPage === 1) {
               prevDataRef.current = responseData;
               return responseData;
            }

            // Append new data if it's different from previous
            const newItems = responseData.filter(
               (item) =>
                  !prev.some((existing) => (existing.value || existing) === (item.value || item)),
            );

            if (newItems.length > 0) {
               prevDataRef.current = responseData;
               return [...prev, ...newItems];
            }

            return prev;
         });
      }
   }, [serverData, currentPage, debouncedSearchTerm]);

   // Reset page when search changes
   useEffect(() => {
      if (searchable) {
         setCurrentPage(1);
      }
   }, [debouncedSearchTerm, searchable]);

   // If using react-hook-form, get the current value from context
   const selectedValue =
      useForm && name && formContext ? (formContext.watch(name) ?? "") : (value ?? "");

   // Use server data or static options. A saved value that isn't in the loaded page (e.g. editing)
   // gets an option from `fallbackLabel`, so it shows and stays selected.
   const loadedOptions = query?.useQuery ? allOptions : staticOptions;
   const options = useMemo(() => {
      if (!fallbackLabel || !selectedValue) return loadedOptions;
      const loaded = loadedOptions.some((opt) => (typeof opt === "string" ? opt : opt?.value) == selectedValue);
      return loaded ? loadedOptions : [{ value: String(selectedValue), label: fallbackLabel }, ...loadedOptions];
   }, [loadedOptions, fallbackLabel, selectedValue]);

   // Handle different pagination response structures
   const paginationData = serverData?.pagination || {};
   const hasMore =
      paginationData.hasMore ||
      (paginationData.currentPage && paginationData.totalPages
         ? paginationData.currentPage < paginationData.totalPages
         : false);
   const totalCount = paginationData.total || allOptions.length || 0;
   const isQueryLoading = isLoading || isFetching;

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
      [
         useForm,
         name,
         setValue,
         onValueChange,
         options,
         clearErrors,
         formContext,
         relatedKeys,
         relatedErrorKeys,
      ],
   );

   // Dynamically get label for selected value
   const selectedDisplayValue = useMemo(() => {
      if (selectedValue) {
         const found = options.find((opt) => {
            if (typeof opt === "string") return opt == selectedValue;
            return opt.value == selectedValue;
         });

         return typeof found === "string"
            ? found
            : (found?.label ?? props.placeholder ?? "Select an option");
      }

      return props.placeholder ?? "Select an option";
   }, [selectedValue, options, props.placeholder]);

   // Setup IntersectionObserver for infinite scroll
   useEffect(() => {
      if (!isOpen || !query?.useQuery || !hasMore || isQueryLoading) return;

      const currentTrigger = loadMoreTriggerRef.current;
      if (!currentTrigger) return;

      const observer = new IntersectionObserver(
         (entries) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasMore && !isQueryLoading) {
               setCurrentPage((prev) => prev + 1);
            }
         },
         {
            root: scrollRef.current,
            rootMargin: "50px",
            threshold: 0.1,
         },
      );

      observer.observe(currentTrigger);
      observerRef.current = observer;

      return () => {
         if (observerRef.current && currentTrigger) {
            observerRef.current.unobserve(currentTrigger);
         }
      };
   }, [isOpen, query?.useQuery, hasMore, isQueryLoading]);

   return (
      <div className={cn("flex flex-col gap-1", className)}>
         {label && <Label>{label}</Label>}
         {description && <p className='text-xs text-muted-foreground'>{description}</p>}

         <Select
            {...(useForm && name ? register(name) : {})}
            value={selectedValue}
            onValueChange={handleChange}
            disabled={disabled}
            open={isOpen}
            onOpenChange={setIsOpen}
            {...props}
         >
            <SelectTrigger
               className={cn(
                  "w-full cursor-pointer [&>svg]:text-current border-outline bg-white",
                  arrowColor && `[&>svg]:text-${arrowColor}`,
                  fieldError && "border-red-500 focus:ring-red-500",
                  triggerClassName,
               )}
            >
               <SelectValue placeholder={props.placeholder}>{selectedDisplayValue}</SelectValue>
            </SelectTrigger>

            <SelectContent className={cn("max-h-72", contentClassName)} ref={scrollRef}>
               <SelectGroup>
                  {label && <SelectLabel>{label}</SelectLabel>}

                  {/* Search input for searchable selects */}
                  {searchable && (
                     <div className='px-2 pb-2 pt-1 sticky top-0 bg-white z-10'>
                        <input
                           type='text'
                           placeholder={searchPlaceholder}
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className='w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-primary'
                           onClick={(e) => e.stopPropagation()}
                        />
                     </div>
                  )}

                  {/* Show "All" option if enabled */}
                  {showAll && !searchable && (
                     <SelectItem value={allValue}>
                        {labelAsNull ? (props.placeholder ?? "Select an option") : allLabel}
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
                  ) : !isQueryLoading ? (
                     <SelectItem
                        value='no-options'
                        disabled
                        className='cursor-not-allowed text-gray-400'
                     >
                        {searchTerm ? "No results found" : "No options available"}
                     </SelectItem>
                  ) : null}

                  {/* Loading indicator */}
                  {isQueryLoading && (
                     <div className='flex items-center justify-center py-2'>
                        <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                        <span className='ml-2 text-xs text-muted-foreground'>Loading...</span>
                     </div>
                  )}

                  {/* Intersection observer trigger for pagination */}
                  {hasMore && !isQueryLoading && options.length > 0 && query?.useQuery && (
                     <div ref={loadMoreTriggerRef} className='h-1 w-full' />
                  )}

                  {/* Total count indicator */}
                  {query?.useQuery && totalCount > 0 && options.length > 0 && !searchTerm && (
                     <div className='px-2 py-1.5 text-xs text-muted-foreground border-t mt-1'>
                        Showing {options.length} of {totalCount}
                     </div>
                  )}
               </SelectGroup>
            </SelectContent>
         </Select>

         {/* Error message */}
         {fieldError && <span className='text-xs text-red-500'>{fieldError}</span>}
      </div>
   );
};

export default SelectAsync;
