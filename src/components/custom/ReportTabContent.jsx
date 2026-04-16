import ICard from "./Card";
import Title from "./Title";
import Paragraph from "./Paragraph";
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
   const cardAction = actionButtons.length > 0 && (
      <div className='flex gap-2'>
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
   );

   const cardTitle = (
      <div className='flex items-center gap-2'>
         <Icon className={`size-5 ${iconColor}`} />
         <div>
            <Title size='sm'>{title}</Title>
            <Paragraph className='text-sm font-normal text-muted-foreground'>{description}</Paragraph>
         </div>
      </div>
   );

   return (
      <ICard
         cardClassName='p-4 gap-3'
         cardContentClassName='px-0'
         cardHeaderClassName='px-0'
         title={cardTitle}
         cardAction={cardAction}
      >
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
      </ICard>
   );
};

export default ReportTabContent;
