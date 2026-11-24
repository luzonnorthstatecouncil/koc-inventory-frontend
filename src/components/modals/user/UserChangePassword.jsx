import IButton from "@/components/custom/Button";
import Form from "@/components/custom/Form";
import IInput from "@/components/custom/Input";
import Modal from "@/components/custom/Modal";
import { useResetPasswordMutation } from "@/features/api/users";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { changePasswordSchema } from "@/lib/zod/schema/editUser";
import { useCallback } from "react";
import { setCredentials, setShowCredentialsModal } from "@/features/slice/userSlice";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MODES = [
   { manual: true, label: "Set a password" },
   { manual: false, label: "Generate and email" },
];

export const UserChangePasswordModal = ({ isOpen, onClose }) => {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const [resetPassword] = useResetPasswordMutation();
   const selectedUser = useSelector((state) => state.user.selectedUser);

   const onSubmit = useCallback(
      async (data) => {
         const isManual = data.manual;

         const confirmed = await confirm({
            title: isManual ? "Change this password?" : "Reset this password?",
            confirmLabel: `${isManual ? "Change" : "Reset"} Password`,
            message: isManual
               ? `${selectedUser.full_name} will sign in with the new password from now on.`
               : `A new password will be generated and emailed to ${selectedUser.full_name}.`,
         });

         if (!confirmed) return;

         const id = toast.loading(`${isManual ? "Changing" : "Resetting"} password...`);
         const {
            success,
            message,
            result: responseData,
         } = await exec(resetPassword, { userId: selectedUser.id, new_password: data.confirm_new_password || null });

         if (!success) {
            toast.dismiss(id);
            return;
         }

         toast.success(message, { id });
         // If the email couldn't be sent, the admin is the only way the user gets these credentials
         if (responseData?.email_sent === false && responseData?.password) {
            dispatch(setCredentials({ username: responseData.username, password: responseData.password }));
            dispatch(setShowCredentialsModal(true));
         }

         onClose();
      },
      [confirm, dispatch, exec, onClose, resetPassword, selectedUser.full_name, selectedUser.id],
   );

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         showFooter={false}
         title='Change password'
         contentClassName='my-0'
         className='pb-0'
      >
         <Form
            className='flex flex-col gap-4'
            onSubmit={onSubmit}
            schema={changePasswordSchema}
            relatedKeys={{ manual: ["new_password", "confirm_new_password"] }}
            defaultValues={{ manual: true, new_password: "", confirm_new_password: "" }}
         >
            {(form) => {
               const manual = form.watch("manual");

               return (
                  <>
                     <div className='flex flex-col gap-0.5 rounded-xl border border-neutral-200 px-4 py-3'>
                        <p className='text-sm font-semibold text-foreground'>{selectedUser?.full_name}</p>
                        <p className='text-xs text-neutral-500'>
                           {selectedUser?.username}
                           {selectedUser?.email && ` · ${selectedUser.email}`}
                        </p>
                     </div>

                     <div role='radiogroup' aria-label='How to set the password' className='grid grid-cols-2 gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1'>
                        {MODES.map((mode) => {
                           const active = manual === mode.manual;
                           return (
                              <button
                                 key={mode.label}
                                 type='button'
                                 role='radio'
                                 aria-checked={active}
                                 onClick={() => form.setValue("manual", mode.manual, { shouldDirty: true })}
                                 className={cn(
                                    "h-8 rounded-md text-sm transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-2 focus-visible:outline-primary",
                                    active
                                       ? "bg-white font-semibold text-foreground shadow-[0_1px_3px_rgb(15_23_42/0.12)]"
                                       : "font-medium text-neutral-500 hover:text-foreground",
                                 )}
                              >
                                 {mode.label}
                              </button>
                           );
                        })}
                     </div>

                     {manual ? (
                        <div className='flex flex-col gap-3'>
                           <IInput type='password' name='new_password' label='New password' placeholder='New password' />
                           <IInput
                              type='password'
                              name='confirm_new_password'
                              label='Confirm password'
                              placeholder='Confirm new password'
                           />
                        </div>
                     ) : (
                        <p className='rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-sm text-neutral-700'>
                           A new password is generated and sent to the user&apos;s email. If the email can&apos;t be sent, you&apos;ll
                           see it here to pass on.
                        </p>
                     )}

                     <footer className='-mx-3 mt-1 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                        <IButton type='button' variant='outline' onClick={onClose}>
                           Cancel
                        </IButton>
                        <IButton type='submit'>{manual ? "Change" : "Reset"} Password</IButton>
                     </footer>
                  </>
               );
            }}
         </Form>
      </Modal>
   );
};
