import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import ICheckbox from "@/components/custom/Checkbox";
import Form from "@/components/custom/Form";
import IInput from "@/components/custom/Input";
import Modal from "@/components/custom/Modal";
import Paragraph from "@/components/custom/Paragraph";
import ISelect from "@/components/custom/Select";
import Title from "@/components/custom/Title";
import { Separator } from "@/components/ui/separator";
import { ROLE_OPTIONS } from "@/constants/options.js";
import { useResetPasswordMutation, useUpdateUserMutation } from "@/features/api/users";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { editUserSchema } from "@/lib/zod/schema/editUser";
import { useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";

export default function EditUser({ isOpen, onClose }) {
   const exec = useCatchQuery();
   const { confirm } = useConfirmation();
   const { selectedUser } = useSelector((state) => state.user);

   const [resetPassword] = useResetPasswordMutation();
   const [updateUser] = useUpdateUserMutation();

   const onSubmit = useCallback(async (data) => {
      const confirmed = await confirm({
         title: "Confirm Update User",
         confirmLabel: "Update User",
         message: `Are you sure you want to update the details for ${selectedUser.full_name}?`,
      });

      if (!confirmed) return;

      const payload = {
         ...data,
         status: data.status ? "active" : "inactive",
      };

      const { success, message } = await exec(updateUser, payload);

      if (!success) {
         return;
      }

      toast.success(message);
      onClose();
   }, []);

   const onResetPassword = useCallback(async () => {
      const confirmed = await confirm({
         title: "Confirm Password Reset",
         confirmLabel: "Reset Password",
         message: `Are you sure you want to reset the password for ${selectedUser.full_name}?`,
      });

      if (!confirmed) return;

      const { success, message } = await exec(resetPassword, selectedUser.id);

      if (!success) {
         return;
      }

      toast.success(message);
   }, [selectedUser]);

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         contentClassName='my-0'
         className='pb-0'
         isLoading={!selectedUser}
         title='Edit User Details'
         description='Modify the details of the selected user.'
         secondaryAction={null}
         primaryAction={null}
      >
         <Form
            className='flex flex-col gap-4'
            onSubmit={onSubmit}
            schema={editUserSchema}
            defaultValues={{
               id: selectedUser?.id || null,
               full_name: selectedUser?.full_name || "",
               username: selectedUser?.username || "",
               email: selectedUser?.email || "",
               role: selectedUser?.role || "user",
               status: selectedUser?.status == "active",
            }}
         >
            <IInput name='full_name' label='Full Name' placeholder='e.g. John Doe' />
            <IInput name='username' label='Username' placeholder='e.g. johndoe123' />
            <IInput name='email' label='Email' placeholder='e.g. john.doe@example.com' />
            <ISelect name='role' label='Role' options={ROLE_OPTIONS} showAll={false} />
            <ICheckbox name='status' label='Is this user active?' />

            <Separator />

            <section>
               <Title>Reset Password</Title>
               <Paragraph className='mb-3'>
                  Upon successful update, the user's password will be reset to a default password that will be sent to
                  their registered email address.
               </Paragraph>

               <IButton
                  variant='outline'
                  className='w-full border-orange-600 text-orange-600 bg-orange-50'
                  type='button'
                  onClick={onResetPassword}
               >
                  Reset Password
               </IButton>
            </section>

            <div className='flex items-center justify-end gap-2 mt-4'>
               <IButtonConfirm
                  title='Cancel Editing'
                  message='Are you sure you want to cancel? All unsaved changes will be lost.'
                  asButton
                  onConfirm={onClose}
               >
                  Cancel
               </IButtonConfirm>
               <IButton type='submit' variant='default'>
                  Save Changes
               </IButton>
            </div>
         </Form>
      </Modal>
   );
}
