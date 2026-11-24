import IButton from "./Button";
import DataTable from "./Datatable";

/** One report: a plain header (title, what it answers, actions) above its table and summary. */
const ReportTabContent = ({
   icon: Icon,
   title,
   description,
   actionButtons = [],
   query,
   columns,
   searchable = true,
   filterable = false,
   initialPageSize = 10,
   emptyMessage,
   footer,
   children,
   filters,
   onMount,
}) => {
   return (
      <section className='flex flex-col gap-4'>
         <header className='flex flex-wrap items-start justify-between gap-3'>
            <div className='flex min-w-0 items-start gap-2.5'>
               {Icon && <Icon className='mt-0.5 size-4 shrink-0 text-neutral-500' aria-hidden='true' />}
               <div className='min-w-0'>
                  <h2 className='text-base font-semibold text-foreground'>{title}</h2>
                  {description && <div className='text-sm text-neutral-500'>{description}</div>}
               </div>
            </div>
            {actionButtons.length > 0 && (
               <div className='flex shrink-0 gap-2'>
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
         </header>

         {/* Headline totals first, where they're seen before scrolling through the rows */}
         {footer}

         <div>
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
            {children}
         </div>
      </section>
   );
};

export default ReportTabContent;
