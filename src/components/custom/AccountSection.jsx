import { cn } from "@/lib/utils";
import Paragraph from "./Paragraph";
import Title from "./Title";
import IButton from "./Button";
import { Pencil, PencilOff } from "lucide-react";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setEditableSection } from "@/features/slice/accountSlice";
import Form from "./Form";

export default function AccountSection({
   title,
   description,
   className,
   wrapperClassName,
   contentClassName,
   editable = false,
   children,
   sectionKey,
   onSubmit,
   defaultValues,
   schema,
   icon = null,
}) {
   const dispatch = useDispatch();
   const { editableSections } = useSelector((state) => state.account);

   const onEdit = useCallback(
      (form) => {
         const isCurrentlyEditing = editableSections[sectionKey];

         // If closing (currently editing), reset the form to default values
         if (isCurrentlyEditing && form) {
            form.reset(defaultValues);
         }

         dispatch(setEditableSection({ ...editableSections, [sectionKey]: !isCurrentlyEditing }));
      },
      [dispatch, sectionKey, editableSections, defaultValues],
   );

   return (
      <section className={cn("w-full", className)}>
         <Form onSubmit={onSubmit} schema={schema} defaultValues={defaultValues}>
            {(form) => (
               <>
                  {/* Header strip: icon + title/desc + edit controls */}
                  {(title || description || editable) && (
                     <div
                        className={cn(
                           "flex items-center justify-between gap-4 px-6 py-3 bg-muted/30 border-b border-outline",
                           wrapperClassName,
                        )}
                     >
                        <div className='flex items-center gap-3'>
                           {icon && (
                              <div className='rounded-lg bg-background border border-outline p-1.5 shrink-0'>
                                 {icon}
                              </div>
                           )}
                           <div>
                              {title && (
                                 <Paragraph
                                    size='lg'
                                    variant='default'
                                    className='max-md:text-sm! max-lg:text-base! font-semibold'
                                 >
                                    {title}
                                 </Paragraph>
                              )}
                              {description && (
                                 <Paragraph size='sm' className='max-md:text-xs! text-muted-foreground'>
                                    {description}
                                 </Paragraph>
                              )}
                           </div>
                        </div>

                        {editable && (
                           <div className='flex items-center gap-2 shrink-0'>
                              {editableSections[sectionKey] ? (
                                 <>
                                    <IButton
                                       type='button'
                                       variant='ghost'
                                       size='sm'
                                       onClick={() => onEdit(form)}
                                       className='text-red-500 hover:text-red-500 hover:bg-red-500/10'
                                    >
                                       Cancel
                                    </IButton>
                                    <IButton type='submit' size='sm' className='w-28'>
                                       Save Changes
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
                  )}

                  {/* Fields */}
                  <div className='px-6 py-5'>
                     <div className={contentClassName}>{children}</div>
                  </div>
               </>
            )}
         </Form>
      </section>
   );
}
