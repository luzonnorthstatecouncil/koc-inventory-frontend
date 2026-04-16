import Paragraph from "./Paragraph";

export default function Details({ label, description, className, labelClassName, descriptionClassName, icon }) {
   return (
      <div className={className}>
         <div className='flex items-center gap-1.5 mb-1'>
            {icon && <span className='text-muted-foreground'>{icon}</span>}
            <Paragraph className={labelClassName}>{label}</Paragraph>
         </div>
         <Paragraph size='sm' variant='default' className={descriptionClassName}>
            {description || `No ${label.toLowerCase()} available.`}
         </Paragraph>
      </div>
   );
}
