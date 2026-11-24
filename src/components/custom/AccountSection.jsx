import { cn } from "@/lib/utils";
import IButton from "./Button";
import { Pencil } from "lucide-react";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setEditableSection } from "@/features/slice/accountSlice";
import Form from "./Form";

/**
 * A settings card: title, description and an Edit / Cancel + Save pair in the header; the fields
 * below switch between read-only rows and inputs.
 */
export default function AccountSection({
   title,
   description,
   className,
   contentClassName,
   editable = false,
   children,
   sectionKey,
   onSubmit,
   defaultValues,
   schema,
}) {
   const dispatch = useDispatch();
   const { editableSections } = useSelector((state) => state.account);
   const isEditing = Boolean(editableSections[sectionKey]);

   const onEdit = useCallback(
      (form) => {
         // Closing without saving puts the fields back as they were
         if (isEditing && form) form.reset(defaultValues);
         dispatch(setEditableSection({ ...editableSections, [sectionKey]: !isEditing }));
      },
      [dispatch, sectionKey, editableSections, defaultValues, isEditing],
   );

   return (
      <section className={cn("w-full rounded-xl border border-neutral-200 bg-white", className)}>
         <Form onSubmit={onSubmit} schema={schema} defaultValues={defaultValues}>
            {(form) => (
               <>
                  {/* A div, not <header>: the e2e helper finds a section's Edit button via its nearest div */}
                  <div className='flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4'>
                     <div className='min-w-0'>
                        {title && <h2 className='text-base font-semibold text-foreground'>{title}</h2>}
                        {description && <p className='text-sm text-neutral-500'>{description}</p>}
                     </div>

                     {editable && (
                        <div className='flex shrink-0 items-center gap-2'>
                           {isEditing ? (
                              <>
                                 <IButton type='button' variant='outline' size='sm' onClick={() => onEdit(form)}>
                                    Cancel
                                 </IButton>
                                 <IButton type='submit' size='sm'>
                                    Save changes
                                 </IButton>
                              </>
                           ) : (
                              <IButton type='button' variant='outline' size='sm' onClick={() => onEdit(form)}>
                                 <Pencil className='size-3.5' />
                                 Edit
                              </IButton>
                           )}
                        </div>
                     )}
                  </div>

                  <div className={cn("px-5 py-4", contentClassName)}>{children}</div>
               </>
            )}
         </Form>
      </section>
   );
}
