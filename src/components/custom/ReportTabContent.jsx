import IButton from "./Button";
import DataTable from "./Datatable";

const ReportTabContent = ({
   icon: Icon,
   iconColor,
   title,
   description,
   actionButtons = [],
   query,
   tableData,
   columns,
   searchable = true,
   filterable = false,
   paginated = true,
   initialPageSize = 10,
   emptyMessage,
   footer,
   children,
   filters,
   onMount,
}) => {
   return (
      <div className='bg-white rounded-xl border border-gray-100 overflow-hidden'>
         {/* Tab header */}
         <div className='flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50'>
            <div className='flex items-start gap-3'>
               <div className={`mt-0.5 p-2 rounded-lg bg-white border border-gray-100 flex-shrink-0`}>
                  <Icon className={`size-4 ${iconColor}`} />
               </div>
               <div>
                  <p className='text-sm font-bold text-foreground leading-tight'>{title}</p>
                  <div className='text-xs text-muted-foreground mt-0.5'>{description}</div>
               </div>
            </div>
            {actionButtons.length > 0 && (
               <div className='flex gap-2 flex-shrink-0'>
                  {actionButtons.map((button, index) => (
                     <IButton
                        key={index}
                        variant={button.variant || "outline"}
                        size='sm'
                        icon={button.icon}
                        onClick={button.onClick}
                     >
                        {button.label}
                     </IButton>
                  ))}
               </div>
            )}
         </div>

         {/* Table */}
         <div className='p-4'>
            <DataTable
               tableClassName='bg-white'
               paginationClassName='bg-white'
               query={query}
               columns={columns}
               searchable={searchable}
               filterable={filterable}
               filters={filters}
               initialPageSize={initialPageSize}
               emptyMessage={emptyMessage}
               onMount={onMount}
            />
            {footer}
            {children}
         </div>
      </div>
   );
};

export default ReportTabContent;

