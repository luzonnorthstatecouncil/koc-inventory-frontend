import IButton from "@/components/custom/Button";
import IButtonConfirm from "@/components/custom/ButtonConfirm";
import ICheckbox from "@/components/custom/Checkbox";
import Form from "@/components/custom/Form";
import IInput from "@/components/custom/Input";
import Modal from "@/components/custom/Modal";
import ISelect from "@/components/custom/Select";
import { ROLE_OPTIONS } from "@/constants/options.js";
import { useCreateUserMutation } from "@/features/api/users";
import { useConfirmation } from "@/helpers/confirmAction";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { createUserDefaultValues, createUserSchema } from "@/lib/zod/schema/createUser";
import { useCallback } from "react";
import { toast } from "sonner";
import UserCredentialsModal from "./UserCredentialsModal";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials, setShowCredentialsModal } from "@/features/slice/userSlice";

export default function CreateUser({ isOpen, onClose }) {
   const exec = useCatchQuery();
   const { confirm } = useConfirmation();
   const [createUser] = useCreateUserMutation();
   const dispatch = useDispatch();
   const { credentials, showCredentialsModal } = useSelector((state) => state.user);

   const onSubmit = useCallback(async (data) => {
      const confirmed = await confirm({
         title: "Confirm User Creation",
         confirmLabel: "Create User",
         message: `Are you sure you want to create a new user with the provided details? Upon creation, an email will be sent to ${data.email} with login instructions.`,
      });

      if (!confirmed) return;

      const payload = {
         ...data,
         userPassword: data.new_password || undefined,
         status: data.status ? "active" : "inactive",
      };

      const id = toast.loading("Creating new user...");

      const { success, message, result: responseData } = await exec(createUser, payload);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message, { id });
      onClose();
   }, []);

   return (
      <>
         <Modal
            isOpen={isOpen}
            onClose={onClose}
            contentClassName='my-0'
            className='pb-0'
            title='Create New User'
            description='Fill out the form below to create a new user.'
            secondaryAction={null}
            primaryAction={null}
         >
            <Form
               className='flex flex-col gap-4'
               onSubmit={onSubmit}
               schema={createUserSchema}
               defaultValues={createUserDefaultValues}
            >
               <IInput name='full_name' label='Full Name' placeholder='e.g. John Doe' />
               <IInput name='username' label='Username' placeholder='e.g. johndoe123' />
               <IInput name='email' label='Email' placeholder='e.g. john.doe@example.com' />
               <ISelect name='role' label='Role' options={ROLE_OPTIONS} showAll={false} />

               <IInput label='New Password (Optional)' type='password' name='new_password' placeholder='*********' />

               <ICheckbox name='status' label='Is this user active?' />

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
      </>
   );
}
