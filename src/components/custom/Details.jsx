import Paragraph from "./Paragraph";

export default function Details({ label, description, className, labelClassName, descriptionClassName }) {
   return (
      <div className={className}>
         <Paragraph className={labelClassName}>{label}</Paragraph>
         <Paragraph size='sm' variant='default' className={descriptionClassName}>
            {description || `No ${label.toLowerCase()} available.`}
         </Paragraph>
      </div>
   );
}
