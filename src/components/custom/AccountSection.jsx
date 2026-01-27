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
      <section className={cn("rounded-md border border-outline p-4 mb-4 w-full", className)}>
         <Form onSubmit={onSubmit} schema={schema} defaultValues={defaultValues}>
            {(form) => (
               <>
                  <header>
                     {editable &&
                        (editableSections[sectionKey] ? (
                           <IButton
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => onEdit(form)}
                              className='px-2 py-1 float-right border-red-500 text-red-500 hover:bg-red-500/10'
                           >
                              <PencilOff className='size-4' />
                              Close
                           </IButton>
                        ) : (
                           <IButton
                              type='button'
                              variant='outline'
                              size='sm'
                              onClick={() => onEdit(form)}
                              className='px-2 py-1 float-right'
                           >
                              <Pencil className='size-4' />
                              Edit
                           </IButton>
                        ))}

                     {title && (
                        <Title size='lg' className='font-semibold'>
                           {title}
                        </Title>
                     )}

                     {description && (
                        <Paragraph className='mb-4' size='sm'>
                           {description}
                        </Paragraph>
                     )}
                  </header>

                  <div className={contentClassName}>{children}</div>

                  {editable && editableSections[sectionKey] && (
                     <IButton variant='default' className='ms-auto w-40 mt-4' type='submit'>
                        Save Changes
                     </IButton>
                  )}
               </>
            )}
         </Form>
      </section>
   );
}
