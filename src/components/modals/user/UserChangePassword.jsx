import IButton from "@/components/custom/Button";
import ICheckbox from "@/components/custom/Checkbox";
import Form from "@/components/custom/Form";
import IInput from "@/components/custom/Input";
import Modal from "@/components/custom/Modal";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { useResetPasswordMutation } from "@/features/api/users";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { changePasswordSchema } from "@/lib/zod/schema/editUser";
import { is } from "date-fns/locale";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

export const UserChangePasswordModal = ({ isOpen, onClose }) => {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const [resetPassword] = useResetPasswordMutation();
   const selectedUser = useSelector((state) => state.user.selectedUser);

   const onSubmit = useCallback(async (data) => {
      const isManual = data.manual;

      const confirmed = await confirm({
         title: `Confirm Password ${isManual ? "Change" : "Reset"}`,
         confirmLabel: `${isManual ? "Change" : "Reset"} Password`,
         message: `Are you sure you want to ${isManual ? "change" : "reset"} the password for ${selectedUser.full_name}?`,
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
      onClose();
   }, []);

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         showFooter={false}
         title='Change Password'
         contentClassName='my-0'
         description='Choose a strong password to keep your account secure. Make sure to remember it or store it in a safe
                  place.'
      >
         <Form
            onSubmit={onSubmit}
            schema={changePasswordSchema}
            relatedKeys={{ manual: ["new_password", "confirm_new_password"] }}
            defaultValues={{ manual: true, new_password: "", confirm_new_password: "" }}
         >
            {(form) => {
               const manual = form.watch("manual");

               return (
                  <>
                     <div className='mb-5'>
                        {manual ? (
                           <>
                              <IInput type='password' name='new_password' placeholder='New password' />
                              <IInput
                                 type='password'
                                 name='confirm_new_password'
                                 placeholder='Confirm new password'
                                 wrapperClassName='mt-2'
                              />
                           </>
                        ) : (
                           <Paragraph size='sm' className='bg-gray-100 p-4 rounded-md'>
                              New password will be automatically generated and sent to the user's email address.
                           </Paragraph>
                        )}

                        <ICheckbox
                           name='manual'
                           label='Manually enter a new password'
                           className='mt-4'
                           defaultChecked
                        />
                     </div>
                     <footer>
                        <IButton type='submit' className='w-full mb-2'>
                           {manual ? "Change" : "Reset"} Password
                        </IButton>
                        <IButton variant='outline' onClick={onClose} className='w-full'>
                           Cancel
                        </IButton>
                     </footer>
                  </>
               );
            }}
         </Form>
      </Modal>
   );
};
