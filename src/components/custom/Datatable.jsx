import React, { useState, useMemo, useEffect, useCallback, useTransition } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import {
   Table,
   TableBody,
   TableCaption,
   TableCell,
   TableFooter,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
   MoreHorizontalIcon,
   SearchIcon,
   FilterIcon,
   XIcon,
   Loader2,
   CalendarDays,
   Calendar,
   ChevronDown,
   ChevronRight,
} from "lucide-react";
import ISelect from "./Select";
import IInput from "./Input";
import Pagination from "./Pagination";
import IButton from "./Button";
import Title from "./Title";
import Paragraph from "./Paragraph";
import DatePicker from "./DatePicker";
import { Checkbox } from "@/components/ui/checkbox";
import ICheckbox from "./Checkbox";
import { useUser } from "@/hooks/useUser";
import { ro } from "date-fns/locale";
import ITooltip from "./Tooltip";
import { Skeleton } from "../ui/skeleton";

const DataTable = ({
   // RTK Query integration (required)
   query,

   tableData: clientSideData,

   // Display props
   title,
   description,
   columns = [],
   caption,
   footer,
   tableClassName,
   tableWrapperClassName,
   tableHeaderClassName,
   wrapperClassName,
   paginationClassName,
   emptyMessage = "No data available",
   searchable = true,
   filterable = true,
   filters = [],
   paginated = true,
   initialPageSize = 10,
   showPageSizeSelector = true,
   actions = [],
   actionButtons = [],
   serverSide = true,
   onRowClick,
   selectable = false,
   onSelectionChange,
   expandable = false,
   renderExpandedRow,
   expandedRowClassName,
   onMount,
   ...props
}) => {
   const user = useUser();
   const userRole = user?.role;

   // State management
   const [currentPage, setCurrentPage] = useState(1);
   const [pageSizeState, setPageSize] = useState(initialPageSize);
   const [searchTerm, setSearchTerm] = useState("");
   const [activeFilters, setActiveFilters] = useState({});
   const [dateRange, setDateRange] = useState(undefined);
   const [selectedRows, setSelectedRows] = useState([]);
   const [expandedRows, setExpandedRows] = useState([]);
   const [isPending, startTransition] = useTransition();

   // Debounced search for better UX
   const debouncedSearchTerm = useDebounce(searchTerm, 500);
   const debouncedDateRange = useDebounce(dateRange, 500);

   // RTK Query integration (server-side only)
   const {
      data: serverSideData,
      isLoading,
      isFetching,
      isError,
      error,
   } = query?.useQuery
      ? query.useQuery(
           {
              ...query?.params,
              page: currentPage,
              pageSize: pageSizeState,
              search: debouncedSearchTerm,
              filters: activeFilters,
              dateRange: debouncedDateRange,
           },
           {
              refetchOnMountOrArgChange: true,
              skip: !serverSide,
              ...query?.options,
           },
        )
      : {};

   // Helper function to get nested value
   const getNestedValue = useCallback((obj, path) => {
      return path.split(".").reduce((current, key) => current?.[key], obj);
   }, []);

   // Reset page when filters change
   useEffect(() => {
      setCurrentPage(1);
   }, [debouncedSearchTerm, activeFilters, debouncedDateRange]);

   // Reset selected rows when page changes
   useEffect(() => {
      setSelectedRows([]);
   }, [currentPage]);

   // Notify parent of selection changes
   useEffect(() => {
      if (onSelectionChange) {
         onSelectionChange(selectedRows);
      }
   }, [selectedRows, onSelectionChange]);

   useEffect(() => {
      if (onMount) onMount(query?.useQuery ? serverSideData : clientSideData);
   }, [serverSideData, clientSideData]);

   const paginateTableData = useCallback(
      (data) => data.slice((currentPage - 1) * pageSizeState, currentPage * pageSizeState),
      [currentPage, pageSizeState],
   );

   const { paginationData, isQueryLoading, tableData } = useMemo(() => {
      return {
         paginationData: serverSideData?.pagination || {},
         isQueryLoading: isLoading || isFetching,
         tableData: serverSide ? serverSideData?.data : paginateTableData(clientSideData),
      };
   }, [serverSideData, isLoading, isFetching, clientSideData, paginateTableData]);

   const handleSelectAll = useCallback(
      (checked) => {
         if (checked) {
            const allIds = tableData?.map((item) => item.id) || [];
            setSelectedRows(allIds);
         } else {
            setSelectedRows([]);
         }
      },
      [tableData],
   );

   const handleSelectRow = useCallback((id, checked) => {
      setSelectedRows((prev) => {
         if (checked) {
            return [...prev, id];
         } else {
            return prev.filter((rowId) => rowId !== id);
         }
      });
   }, []);

   const toggleRowExpansion = useCallback((id) => {
      setExpandedRows((prev) => {
         if (prev.includes(id)) {
            return prev.filter((rowId) => rowId !== id);
         } else {
            return [...prev, id];
         }
      });
   }, []);

   const isAllSelected = useMemo(() => {
      return tableData?.length > 0 && selectedRows.length === tableData.length;
   }, [tableData, selectedRows]);

   const isSomeSelected = useMemo(() => {
      return selectedRows.length > 0 && selectedRows.length < (tableData?.length || 0);
   }, [tableData, selectedRows]);

   const renderCellValue = useCallback(
      (item, column) => {
         if (column.headerRender) {
            return column.headerRender();
         }

         if (column.render) {
            return column.render(getNestedValue(item, column.key), item);
         }

         if (column.accessor) {
            return column.accessor(item);
         }

         return getNestedValue(item, column.key);
      },
      [getNestedValue],
   );

   const calculateFooterValue = useCallback((column) => {
      if (column.footerRender) {
         return column.footerRender(tableData);
      }

      if (column.sum) {
         const sum = tableData.reduce((acc, item) => {
            const value =
               typeof getNestedValue(item, column.key) === "number"
                  ? getNestedValue(item, column.key)
                  : parseFloat(getNestedValue(item, column.key)) || 0;
            return acc + value;
         }, 0);
         return column.formatSum ? column.formatSum(sum) : sum;
      }

      return column.footerValue || "";
   }, []);

   const handleFilterChange = useCallback((filterKey, value) => {
      startTransition(() => {
         setActiveFilters((prev) => ({
            ...prev,
            [filterKey]: value,
         }));
      });
   }, []);

   const clearFilters = useCallback(() => {
      setActiveFilters({});
      setSearchTerm("");
      setDateRange(undefined);
   }, []);

   const hasActiveFilters = useMemo(
      () =>
         Object.values(activeFilters).some((value) => value && value !== "all") ||
         searchTerm ||
         dateRange?.from ||
         dateRange?.to,
      [activeFilters, searchTerm, dateRange],
   );

   const clientSidePaginate = useMemo(() => {
      if (!paginated || serverSide) return tableData;

      return {
         currentPage,
         totalPages: Math.ceil(clientSideData?.length / pageSizeState),
         total: clientSideData?.length || 0,
         pageSize: pageSizeState,
      };
   }, [clientSideData, currentPage, pageSizeState, tableData]);

   // Add actions column if actions are provided
   const columnsWithActions = useMemo(() => {
      let cols = [...columns];

      // Add expand/collapse column if expandable
      if (expandable) {
         cols = [
            {
               key: "expand",
               title: "",
               width: "50px",
               cellClassName: "text-center",
               render: (_, item) => (
                  <Button
                     variant='ghost'
                     size='sm'
                     className='h-6 w-6 p-0'
                     onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(item.id);
                     }}
                  >
                     {expandedRows.includes(item.id) ? (
                        <ChevronDown className='h-4 w-4' />
                     ) : (
                        <ChevronRight className='h-4 w-4' />
                     )}
                  </Button>
               ),
            },
            ...cols,
         ];
      }

      // Add checkbox column if selectable
      if (selectable) {
         cols = [
            {
               key: "select",
               title: "",
               width: "50px",
               cellClassName: "text-center",
               headerRender: () => (
                  <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} aria-label='Select all rows' />
               ),
               render: (_, item) => (
                  <Checkbox
                     checked={selectedRows.includes(item.id)}
                     onCheckedChange={(checked) => handleSelectRow(item.id, checked)}
                     aria-label={`Select row ${item.id}`}
                  />
               ),
            },
            ...cols,
         ];
      }

      if (actions.length === 0) return cols;

      return [
         ...cols,
         {
            key: "actions",
            title: "Actions",
            width: "100px",
            cellClassName: "text-center",
            render: (_, item) => (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant='ghost' className='h-8 w-8 p-0'>
                        <MoreHorizontalIcon className='h-4 w-4' />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                     {(() => {
                        const availableActions = actions.filter((action) => {
                           const isShown = action.show ? action.show(item) : true;
                           const roleAuthorized = action.roles ? action.roles.includes(userRole) : true;
                           return isShown && roleAuthorized;
                        });

                        if (availableActions.length === 0) {
                           return (
                              <DropdownMenuItem disabled className='text-muted-foreground'>
                                 No actions available
                              </DropdownMenuItem>
                           );
                        }

                        return availableActions.map((action, index) => (
                           <DropdownMenuItem
                              key={index}
                              onSelect={() => {
                                 setTimeout(() => {
                                    action.action?.(item);
                                 }, 100);
                              }}
                              className={cn(action.className)}
                           >
                              {action.icon && <action.icon className='mr-2 size-4 text-inherit' />}
                              {action.label}
                           </DropdownMenuItem>
                        ));
                     })()}
                  </DropdownMenuContent>
               </DropdownMenu>
            ),
         },
      ];
   }, [
      columns,
      actions,
      expandable,
      expandedRows,
      toggleRowExpansion,
      selectable,
      isAllSelected,
      handleSelectAll,
      selectedRows,
      handleSelectRow,
      userRole,
   ]);

   return (
      <div className={cn("w-full", wrapperClassName)}>
         <header className={cn("mb-4", tableHeaderClassName)}>
            {(title || description) && (
               <div className='mb-3'>
                  {title && <Title>{title}</Title>}
                  {description && <Paragraph>{description}</Paragraph>}
               </div>
            )}

            {/* Filters and Search */}
            {(searchable || filterable || filters.length > 0 || actionButtons.length > 0) && (
               <div className='flex flex-col gap-2 sm:gap-4'>
                  <div className='flex flex-col sm:flex-row items-stretch sm:items-end gap-2 sm:gap-4'>
                     {/* Search Input */}
                     {searchable && (
                        <div className='w-full sm:w-auto flex'>
                           <IInput
                              useForm={false}
                              placeholder='Search...'
                              className='bg-white !text-xs text-black w-full sm:w-70'
                              prefix={<SearchIcon className='size-4 text-black' />}
                              value={searchTerm}
                              onChange={(e) => {
                                 startTransition(() => {
                                    setSearchTerm(e.target.value);
                                 });
                              }}
                           />
                        </div>
                     )}

                     {/* Select Filters */}
                     {filterable && filters.length > 0 && (
                        <div className='flex flex-wrap items-center gap-2'>
                           {hasActiveFilters && (
                              <Button
                                 variant='ghost'
                                 size='sm'
                                 onClick={clearFilters}
                                 className='h-6 px-2 text-xs text-destructive hover:bg-transparent hover:text-destructive/60'
                              >
                                 <XIcon className='size-4' />
                                 <span className='hidden sm:inline'>Clear Filters</span>
                              </Button>
                           )}

                           {filters.map((filter) => {
                              if (filter.type === "date") {
                                 return (
                                    <DatePicker
                                       mode='range'
                                       key={filter.key}
                                       label={null}
                                       showClear={false}
                                       useForm={false}
                                       value={dateRange}
                                       defaultMonth={new Date()}
                                       onChange={(date) => {
                                          startTransition(() => {
                                             setDateRange(date);
                                          });
                                       }}
                                       placeholder='Select date range'
                                       triggerClassName='text-xs bg-white text-black [&>svg]:!text-black hover:bg-primary/10'
                                       suffix={<Calendar className='size-3.5' />}
                                    />
                                 );
                              }

                              if (filter.type === "boolean") {
                                 return (
                                    <ICheckbox
                                       name={filter.key}
                                       useForm={false}
                                       key={filter.key}
                                       label={filter.label}
                                       checked={activeFilters[filter.key] || false}
                                       labelClassName='w-max mr-2'
                                       onCheckedChange={(checked) =>
                                          handleFilterChange(filter.key, checked ? true : false)
                                       }
                                    />
                                 );
                              }

                              return (
                                 <ISelect
                                    key={filter.key}
                                    options={filter.options}
                                    value={activeFilters[filter.key] || "all"}
                                    onValueChange={(value) => handleFilterChange(filter.key, value?.value ?? "")}
                                    placeholder={`Select ${filter.label}`}
                                    labelAsNull
                                    showAll={true}
                                    allValue='all'
                                    contentClassName='bg-white'
                                    variant='destructive'
                                    triggerClassName={`text-xs bg-white text-black [&>svg]:!text-black hover:bg-primary/10 ${
                                       activeFilters[filter.key] && activeFilters[filter.key] !== "all"
                                          ? "font-semibold"
                                          : ""
                                    }`}
                                 />
                              );
                           })}
                        </div>
                     )}

                     {/* Action Buttons */}
                     {actionButtons.length > 0 && (
                        <div className='w-full sm:w-auto sm:ml-auto flex items-center gap-2 flex-wrap'>
                           {actionButtons
                              .filter((i) => !i.hidden)
                              .map((button, index) => {
                                 if (button.roles && !button.roles.includes(userRole)) {
                                    return null;
                                 }

                                 return (
                                    <IButton
                                       key={index}
                                       variant={button.variant ?? "default"}
                                       onClick={button.onClick}
                                       className={cn(button.className, "text-xs sm:text-sm")}
                                       icon={button.icon}
                                    >
                                       {button.label}
                                    </IButton>
                                 );
                              })}
                        </div>
                     )}
                  </div>
               </div>
            )}
         </header>

         {/* Table */}
         <div className={cn("overflow-x-auto overflow-y-hidden w-full border rounded-lg", tableWrapperClassName)}>
            <Table className={cn(tableClassName, "w-full")} {...props}>
               {caption && <TableCaption>{caption}</TableCaption>}

               <TableHeader>
                  <TableRow>
                     {columnsWithActions.map((column, index) => (
                        <TableHead
                           key={column.key || column.title}
                           className={cn(
                              column.headerClassName,
                              "bg-gray-300 text-black",
                              !actions.length && index === columnsWithActions.length - 1 && "text-end",
                           )}
                           style={{ width: column.width }}
                        >
                           {column.headerRender ? column.headerRender() : column.title}
                        </TableHead>
                     ))}
                  </TableRow>
               </TableHeader>

               <TableBody className={cn(isPending && "opacity-50 transition-opacity")}>
                  {isQueryLoading ? (
                     Array.from({ length: 3 }).map((_, rowIndex) => (
                        <TableRow key={rowIndex}>
                           <TableCell colSpan={columnsWithActions.length} className='py-3'>
                              <div className='flex items-center gap-3'>
                                 <Skeleton className='h-8 w-8 rounded' />
                                 <div className='flex-1 space-y-2'>
                                    <Skeleton className='h-4 w-[60%]' />
                                    <Skeleton className='h-3 w-[40%]' />
                                 </div>
                                 <Skeleton className='h-8 w-20' />
                              </div>
                           </TableCell>
                        </TableRow>
                     ))
                  ) : tableData?.length > 0 ? (
                     tableData?.map((item, index) => (
                        <React.Fragment key={item.id || item.key || index}>
                           <TableRow onClick={() => onRowClick?.(item)} className={onRowClick && "cursor-pointer"}>
                              {columnsWithActions.map((column, index) => (
                                 <TableCell
                                    key={column.key || column.title}
                                    className={cn(
                                       column.cellClassName,
                                       "py-1 max-w-40",
                                       !actions.length && index === columnsWithActions.length - 1 && "text-end",
                                    )}
                                 >
                                    {renderCellValue(item, column)}
                                 </TableCell>
                              ))}
                           </TableRow>
                           {expandable && expandedRows.includes(item.id) && (
                              <TableRow className={cn("bg-muted/30", expandedRowClassName)}>
                                 <TableCell colSpan={columnsWithActions.length} className='p-4'>
                                    {renderExpandedRow?.(item)}
                                 </TableCell>
                              </TableRow>
                           )}
                        </React.Fragment>
                     ))
                  ) : (
                     <TableRow>
                        <TableCell
                           colSpan={columnsWithActions.length}
                           className='text-center py-8 text-muted-foreground'
                        >
                           {hasActiveFilters ? "No results found with current filters" : emptyMessage}
                        </TableCell>
                     </TableRow>
                  )}
               </TableBody>

               {(footer || columns.some((col) => col.sum || col.footerValue || col.footerRender)) && (
                  <TableFooter>
                     <TableRow>
                        {columnsWithActions.map((column, index) => {
                           const columnsHasFooter = columns.some(
                              (col) => col.sum || col.footerValue || col.footerRender,
                           );

                           if (!columnsHasFooter && index > 0) return null;

                           return (
                              <TableCell
                                 key={column.key || column.title}
                                 className={cn(column.footerClassName)}
                                 colSpan={footer && index === 0 ? columnsWithActions.length : undefined}
                              >
                                 {!columnsHasFooter
                                    ? footer
                                    : footer && index === columns.length - 1
                                      ? footer.value
                                      : calculateFooterValue(column)}
                              </TableCell>
                           );
                        })}
                     </TableRow>
                  </TableFooter>
               )}
            </Table>
         </div>

         {/* Pagination */}
         {paginated && (
            <Pagination
               className={cn("mt-4", paginationClassName)}
               currentPage={serverSide ? currentPage : clientSidePaginate.currentPage}
               totalPages={serverSide ? paginationData.totalPages || 0 : clientSidePaginate.totalPages || 0}
               pageSize={pageSizeState}
               totalCount={serverSide ? paginationData.total || 0 : clientSidePaginate.total || 0}
               isLoading={isQueryLoading}
               showPageSizeSelector={showPageSizeSelector}
               onPageChange={(page) => {
                  startTransition(() => {
                     setCurrentPage(page);
                  });
               }}
               onPageSizeChange={(newPageSize) => {
                  startTransition(() => {
                     setPageSize(newPageSize);
                     setCurrentPage(1);
                  });
               }}
            />
         )}
      </div>
   );
};

export default DataTable;
