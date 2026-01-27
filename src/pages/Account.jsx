import AccountSection from "@/components/custom/AccountSection";
import AccountSkeleton from "@/components/custom/AccountSkeleton";
import IButton from "@/components/custom/Button";
import Details from "@/components/custom/Details";
import EditableDetails from "@/components/custom/EditableDetails";
import Paragraph from "@/components/custom/Paragraph";
import Title from "@/components/custom/Title";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ACCOUNT, HOME } from "@/constants/routes";
import {
   useResetPasswordMutation,
   useUpdateAccountDetailsMutation,
   useUpdatePersonalInfoMutation,
} from "@/features/api/users";
import { useConfirmation } from "@/helpers/confirmAction";
import { dateParser } from "@/helpers/parser";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import { useUser } from "@/hooks/useUser";
import PageLayout from "@/layout/PageLayout";
import { accountDetailsSchema, userInfoSchema } from "@/lib/zod/schema/profile";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import LogoEmblem from "@/assets/images/logos/logo_emblem.png";

const breadcrumbItems = [{ label: HOME.title }, { label: ACCOUNT.title }];

export default function Account() {
   const user = useUser();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const { editableSections } = useSelector((state) => state.account);

   const [resetPassword] = useResetPasswordMutation();
   const [updatePersonalInfo] = useUpdatePersonalInfoMutation();
   const [updateAccountDetails] = useUpdateAccountDetailsMutation();

   const onResetPassword = async () => {
      const confirmed = await confirm({
         title: "Confirm Password Reset",
         confirmLabel: "Reset Password",
         message: `Are you sure you want to reset the password for ${user.fullname}?`,
      });

      if (!confirmed) return;

      const id = toast.loading("Resetting password...");
      const { success, message } = await exec(resetPassword, user.id);

      if (!success) return;

      toast.success(message, { id });
   };

   const onUpdatePersonalInfo = async (data) => {
      const confirmed = await confirm({
         title: "Confirm Personal Information Update",
         confirmLabel: "Update",
         message: `Are you sure you want to update the personal information for ${user.fullname}?`,
      });

      if (!confirmed) return;

      const id = toast.loading("Updating personal information...");
      const { success, message } = await exec(updatePersonalInfo, data);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message, { id });
   };

   const onUpdateAccountDetails = async (data) => {
      const confirmed = await confirm({
         title: "Confirm Account Details Update",
         confirmLabel: "Update",
         message: `Are you sure you want to update the account details for ${user.fullname}?`,
      });

      if (!confirmed) return;

      const id = toast.loading("Updating account details...");
      const { success, message } = await exec(updateAccountDetails, data);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message, { id });
   };

   return (
      <PageLayout breadcrumbItems={breadcrumbItems} route={ACCOUNT}>
         <main className='w-full pt-2 sm:pt-3'>
            <AccountSection
               className='border-l-2 sm:border-l-3 border-l-outline'
               contentClassName='flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-0'
            >
               <Avatar className='size-14 sm:size-18'>
                  <AvatarImage src={LogoEmblem} />
                  <AvatarFallback>{user?.fullname?.charAt(0).toUpperCase()}</AvatarFallback>
               </Avatar>
               <div className='sm:ml-4'>
                  <Title className='text-base sm:text-lg'>{user?.fullname || "User"}</Title>
                  <Paragraph size='sm' variant='default'>
                     {user?.email || "No email available."}
                  </Paragraph>
               </div>
            </AccountSection>

            <AccountSection
               editable
               sectionKey='personalInfo'
               contentClassName='space-y-3'
               title='Personal Information'
               className='border-l-2 sm:border-l-3 border-l-emphasis'
               description='Manage your personal details and keep your account information up to date.'
               onSubmit={onUpdatePersonalInfo}
               schema={userInfoSchema}
               defaultValues={{
                  fullname: user?.fullname || "",
                  email: user?.email || "",
               }}
            >
               <EditableDetails
                  name='fullname'
                  label='Full Name'
                  description={user?.fullname || "User"}
                  isEdit={editableSections.personalInfo}
               />
               <EditableDetails
                  name='email'
                  label='Email'
                  description={user?.email || "No email available."}
                  isEdit={editableSections.personalInfo}
               />
            </AccountSection>

            <AccountSection
               editable
               sectionKey='accountDetails'
               contentClassName='space-y-3'
               title='Account Details'
               className='border-l-2 sm:border-l-3 border-l-secondary'
               description='View and manage your account settings and preferences.'
               onSubmit={onUpdateAccountDetails}
               schema={accountDetailsSchema}
               defaultValues={{
                  username: user?.username || "",
               }}
            >
               <Details label='User Role' description={user?.role || "User"} />
               <EditableDetails
                  label='Username'
                  name='username'
                  description={user?.username || "User"}
                  isEdit={editableSections.accountDetails}
               />
               <Details label='Date Joined' description={dateParser(user?.created_at, "PPPP")} />
               <Details
                  label='Account Status'
                  description={
                     <Badge className='mt-1' variant={user?.status === "active" ? "success" : "destructive"}>
                        {user?.status === "active" ? "Active" : "Inactive"}
                     </Badge>
                  }
               />
            </AccountSection>

            <AccountSection
               contentClassName='space-y-3'
               title='Account Settings'
               className='border-l-2 sm:border-l-3 border-l-primary'
               description='Change passwords, enable two-factor authentication, and manage other security settings.'
            >
               <section className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 w-full sm:w-2/3 lg:w-1/3'>
                  <Details label='Password' description='************' />
                  <IButton variant='ghost' className='text-xs sm:text-sm' onClick={onResetPassword}>
                     Reset Password
                  </IButton>
               </section>

               <section className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 w-full sm:w-2/3 lg:w-1/3'>
                  <Details label='Two-Factor Authentication' description='Disabled' />
                  <IButton variant='ghost' className='text-xs sm:text-sm'>
                     Manage 2FA
                  </IButton>
               </section>

               <section className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 w-full sm:w-2/3 lg:w-1/3'>
                  <Details label='Notifications' description='Disabled' />
                  <IButton variant='ghost' className='text-xs sm:text-sm'>
                     Manage Notifications
                  </IButton>
               </section>
            </AccountSection>
         </main>
      </PageLayout>
   );
}
