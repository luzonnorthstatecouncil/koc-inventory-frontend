import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import ICheckbox from "@/components/custom/Checkbox";
import Form from "@/components/custom/Form";
import IInput from "@/components/custom/Input";
import Modal from "@/components/custom/Modal";
import ISelect from "@/components/custom/Select";
import { ROLE_OPTIONS } from "@/constants/options.js";
import { useCreateUserMutation, useUpdateUserMutation } from "@/features/api/users";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { createUserDefaultValues, createUserSchema } from "@/lib/zod/schema/createUser";
import { editUserSchema } from "@/lib/zod/schema/editUser";
import { setCredentials, setShowCredentialsModal } from "@/features/slice/userSlice";
import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

/**
 * Create a user, or edit the selected one (`isEditing`, values prefilled from the store).
 * Only creating offers a starting password; existing passwords change through Change password.
 */
export default function ManageUser({ isOpen, onClose, isEditing = false }) {
   const exec = useCatchQuery();
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const { selectedUser } = useSelector((state) => state.user);
   const [createUser] = useCreateUserMutation();
   const [updateUser] = useUpdateUserMutation();

   const defaultValues = useMemo(
      () =>
         isEditing
            ? {
                 id: selectedUser?.id || null,
                 full_name: selectedUser?.full_name || "",
                 username: selectedUser?.username || "",
                 email: selectedUser?.email || "",
                 role: selectedUser?.role || "user",
                 status: selectedUser?.status == "active",
              }
            : createUserDefaultValues,
      [isEditing, selectedUser],
   );

   const onSubmit = useCallback(
      async (data) => {
         const confirmed = await confirm(
            isEditing
               ? {
                    title: "Save changes?",
                    confirmLabel: "Save changes",
                    message: `Update ${selectedUser?.full_name}'s account with the changes you made?`,
                 }
               : {
                    title: "Create this account?",
                    confirmLabel: "Create user",
                    message: `Login instructions will be emailed to ${data.email}.`,
                 },
         );
         if (!confirmed) return;

         if (isEditing) {
            const { success, message } = await exec(updateUser, { ...data, status: data.status ? "active" : "inactive" });
            if (!success) return;
            toast.success(message);
            onClose();
            return;
         }

         const id = toast.loading("Creating user...");
         const payload = {
            ...data,
            userPassword: data.new_password || undefined,
            status: data.status ? "active" : "inactive",
         };
         const { success, message, result: responseData } = await exec(createUser, payload);
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
      [confirm, createUser, dispatch, exec, isEditing, onClose, selectedUser?.full_name, updateUser],
   );

   return (
      <Modal
         isOpen={isOpen}
         onClose={onClose}
         contentClassName='my-0'
         className='pb-0'
         isLoading={isEditing && !selectedUser}
         title={isEditing ? "Edit user" : "Create user"}
         description={isEditing ? "Update the account's details and access." : "Give someone access to the system."}
         secondaryAction={null}
         primaryAction={null}
      >
         <Form
            key={isEditing ? `edit-${selectedUser?.id}` : "create"}
            className='flex flex-col gap-4'
            onSubmit={onSubmit}
            schema={isEditing ? editUserSchema : createUserSchema}
            defaultValues={defaultValues}
         >
            {(form) => (
               <>
                  <IInput name='full_name' label='Full name' placeholder='e.g. Juan Dela Cruz' />

                  <fieldset className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                     <IInput name='username' label='Username' placeholder='e.g. juandc' />
                     <ISelect name='role' label='Role' options={ROLE_OPTIONS} showAll={false} className='w-full' />
                  </fieldset>

                  <IInput name='email' label='Email' placeholder='e.g. juan@example.com' />

                  {!isEditing && (
                     <div className='flex flex-col gap-1'>
                        <IInput label='Password (optional)' type='password' name='new_password' placeholder='Leave blank to generate one' />
                        <p className='text-xs text-neutral-500'>Leave it blank and a password is generated and emailed.</p>
                     </div>
                  )}

                  <div className='flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-2.5'>
                     <ICheckbox name='status' label='Active' labelClassName='text-sm font-medium' />
                     <p className='pl-6 text-xs text-neutral-500'>Only active users can sign in.</p>
                  </div>

                  <footer className='-mx-3 mt-1 flex items-center justify-end gap-2 border-t border-neutral-200 px-3 pt-3 pb-3 sm:-mx-4 sm:px-4 md:-mx-6 md:px-6'>
                     <IButtonConfirm
                        title={isEditing ? "Discard changes?" : "Discard new user?"}
                        message={isEditing ? "Your changes to this account will be lost." : "The details you entered will be lost."}
                        cancelLabel='Keep editing'
                        confirmLabel='Discard'
                        asButton
                        onConfirm={onClose}
                        isDirty={form.formState.isDirty}
                     >
                        Cancel
                     </IButtonConfirm>
                     <IButton type='submit' variant='default'>
                        {isEditing ? "Save changes" : "Create user"}
                     </IButton>
                  </footer>
               </>
            )}
         </Form>
      </Modal>
   );
}
