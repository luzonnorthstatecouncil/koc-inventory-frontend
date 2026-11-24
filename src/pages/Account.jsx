import AccountSection from "@/components/custom/AccountSection";
import IButton from "@/components/custom/Button";
import EditableDetails, { ReadOnlyRow } from "@/components/custom/EditableDetails";
import { ACCOUNT } from "@/constants/routes";
import { ROLE_OPTIONS } from "@/constants/options.js";
import { useUpdateAccountDetailsMutation, useUpdatePersonalInfoMutation } from "@/features/api/users";
import { useConfirmation } from "@/helpers/confirmAction";
import { dateParser } from "@/helpers/parser";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { useUser } from "@/hooks/useUser";
import PageLayout from "@/layout/PageLayout";
import { accountDetailsSchema, userInfoSchema } from "@/lib/zod/schema/profile";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { UserChangePasswordModal } from "@/components/modals/user/UserChangePassword";
import { setOpenChangePasswordModal, setSelectedUser } from "@/features/slice/userSlice";

const roleLabel = (role) => ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role ?? "—";

const initials = (name = "") =>
   name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";

function SecurityRow({ title, description, action }) {
   return (
      <div className='flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0'>
         <div className='min-w-0'>
            <p className='text-sm font-medium text-foreground'>{title}</p>
            <p className='text-xs text-neutral-500'>{description}</p>
         </div>
         {action}
      </div>
   );
}

export default function Account() {
   const user = useUser();
   const exec = useCatchQuery();
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const { editableSections } = useSelector((state) => state.account);
   const { openChangePasswordModal } = useSelector((state) => state.user);

   const [updatePersonalInfo] = useUpdatePersonalInfoMutation();
   const [updateAccountDetails] = useUpdateAccountDetailsMutation();

   const isActive = user?.status === "active";

   const onChangePasswordClose = () => {
      dispatch(setOpenChangePasswordModal(false));
      dispatch(setSelectedUser(null));
   };

   const onOpenChangePassword = () => {
      dispatch(setSelectedUser(user));
      dispatch(setOpenChangePasswordModal(true));
   };

   const onUpdatePersonalInfo = async (data) => {
      const confirmed = await confirm({
         title: "Save your details?",
         confirmLabel: "Save",
         message: "Your name and email will be updated.",
      });
      if (!confirmed) return;

      const id = toast.loading("Saving your details...");
      const { success, message } = await exec(updatePersonalInfo, data);
      if (!success) {
         toast.dismiss(id);
         return;
      }
      toast.success(message, { id });
   };

   const onUpdateAccountDetails = async (data) => {
      const confirmed = await confirm({
         title: "Change your username?",
         confirmLabel: "Save",
         message: "You'll sign in with the new username from now on.",
      });
      if (!confirmed) return;

      const id = toast.loading("Saving your username...");
      const { success, message } = await exec(updateAccountDetails, data);
      if (!success) {
         toast.dismiss(id);
         return;
      }
      toast.success(message, { id });
   };

   return (
      <PageLayout route={ACCOUNT}>
         <main className='mx-auto flex w-full max-w-3xl flex-col gap-5 pb-8'>
            <header>
               <h1 className='text-2xl font-bold tracking-tight text-foreground'>Account</h1>
               <p className='text-sm text-neutral-500'>Your profile, sign-in details and password.</p>
            </header>

            {/* Who's signed in */}
            <section className='flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-white p-5'>
               <span
                  className='flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-white'
                  aria-hidden='true'
               >
                  {initials(user?.fullname)}
               </span>
               <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
                  <p className='truncate text-lg font-semibold text-foreground'>{user?.fullname || "User"}</p>
                  <p className='truncate text-sm text-neutral-500'>{user?.email || "No email"}</p>
               </div>
               <dl className='flex flex-wrap gap-x-8 gap-y-2 text-sm'>
                  <div className='flex flex-col gap-0.5'>
                     <dt className='text-xs text-neutral-500'>Role</dt>
                     <dd className='font-medium text-foreground'>{roleLabel(user?.role)}</dd>
                  </div>
                  <div className='flex flex-col gap-0.5'>
                     <dt className='text-xs text-neutral-500'>Status</dt>
                     <dd className={cn("inline-flex items-center gap-2 font-medium", isActive ? "text-neutral-700" : "text-neutral-500")}>
                        <span className={cn("size-2 rounded-full", isActive ? "bg-emerald-500" : "bg-neutral-300")} aria-hidden='true' />
                        {isActive ? "Active" : "Inactive"}
                     </dd>
                  </div>
                  {user?.created_at && (
                     <div className='flex flex-col gap-0.5'>
                        <dt className='text-xs text-neutral-500'>Joined</dt>
                        <dd className='font-medium text-foreground tabular-nums'>{dateParser(user.created_at, "PP")}</dd>
                     </div>
                  )}
               </dl>
            </section>

            <AccountSection
               editable
               sectionKey='personalInfo'
               contentClassName='flex flex-col gap-3'
               title='Personal information'
               description='Your name and the email that receives login instructions.'
               onSubmit={onUpdatePersonalInfo}
               schema={userInfoSchema}
               defaultValues={{
                  fullname: user?.fullname || "",
                  email: user?.email || "",
               }}
            >
               <EditableDetails
                  name='fullname'
                  label='Full name'
                  description={user?.fullname || "—"}
                  isEdit={editableSections.personalInfo}
               />
               <EditableDetails
                  name='email'
                  label='Email'
                  description={user?.email || "No email"}
                  isEdit={editableSections.personalInfo}
               />
            </AccountSection>

            <AccountSection
               editable
               sectionKey='accountDetails'
               contentClassName='flex flex-col gap-3'
               title='Account details'
               description='The username you sign in with. Your role is set by an administrator.'
               onSubmit={onUpdateAccountDetails}
               schema={accountDetailsSchema}
               defaultValues={{
                  username: user?.username || "",
               }}
            >
               <EditableDetails
                  label='Username'
                  name='username'
                  description={user?.username || "—"}
                  isEdit={editableSections.accountDetails}
               />
               <ReadOnlyRow label='Role' value={roleLabel(user?.role)} />
               {user?.created_at && <ReadOnlyRow label='Joined' value={dateParser(user.created_at, "PPPP")} />}
            </AccountSection>

            <section className='rounded-xl border border-neutral-200 bg-white'>
               <header className='border-b border-neutral-200 px-5 py-4'>
                  <h2 className='text-base font-semibold text-foreground'>Security</h2>
                  <p className='text-sm text-neutral-500'>Your password and sign-in protection.</p>
               </header>
               <div className='divide-y divide-neutral-100 px-5 py-4'>
                  <SecurityRow
                     title='Password'
                     description='Set a new one yourself, or have one generated and emailed to you.'
                     action={
                        <IButton variant='outline' size='sm' className='shrink-0' onClick={onOpenChangePassword}>
                           Change password
                        </IButton>
                     }
                  />
                  <SecurityRow
                     title='Two-factor authentication'
                     description='A second step when signing in.'
                     action={<span className='text-xs font-medium text-neutral-500'>Coming soon</span>}
                  />
                  <SecurityRow
                     title='Notifications'
                     description='Emails about sign-ins and account changes.'
                     action={<span className='text-xs font-medium text-neutral-500'>Coming soon</span>}
                  />
               </div>
            </section>
         </main>

         {openChangePasswordModal && (
            <UserChangePasswordModal isOpen={openChangePasswordModal} onClose={onChangePasswordClose} />
         )}
      </PageLayout>
   );
}
