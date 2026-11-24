import IInput from "./Input";

/** A settings field: a label/value row while viewing, a full-width input while editing. */
export default function EditableDetails({ label, description, isEdit = false, name }) {
   return isEdit ? (
      <IInput name={name} label={label} placeholder={`Enter ${label.toLowerCase()}`} />
   ) : (
      <ReadOnlyRow label={label} value={description} />
   );
}

export function ReadOnlyRow({ label, value }) {
   return (
      <div className='flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6'>
         <dt className='text-sm text-neutral-600'>{label}</dt>
         <dd className='min-w-0 truncate text-sm font-medium text-foreground'>{value}</dd>
      </div>
   );
}
