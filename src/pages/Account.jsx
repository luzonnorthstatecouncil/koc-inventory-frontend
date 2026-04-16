import AccountSection from "@/components/custom/AccountSection";
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
import { AtSign, CalendarDays, CircleDot, IdCard, KeyRound, Mail, ShieldCheck, User, UserRound } from "lucide-react";
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

      if (!success) {
         toast.dismiss(id);
         return;
      }

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
         <main className='w-full pb-8'>
            {/* ── Page Header ── */}
            <Title className='text-lg md:text-2xl! lg:text-4xl! font-bold'>Account Settings</Title>
            <Paragraph size='sm' className='text-muted-foreground mt-1 mb-4'>
               Manage your profile, personal information, and account security.
            </Paragraph>

            {/* ── Profile Hero ── */}
            <div className='rounded-xl border border-outline bg-white shadow-sm overflow-hidden mb-6'>
               {/* Gradient banner */}
               <div className='h-20 bg-gradient-to-br from-primary to-primary/70' />

               {/* Avatar + name row */}
               <div className='px-6 pb-4 -mt-10 flex flex-col sm:flex-row sm:items-end gap-3 pt-6'>
                  <Avatar className='size-20 ring-4 ring-white shadow-md shrink-0'>
                     <AvatarImage src={LogoEmblem} />
                     <AvatarFallback className='text-2xl font-bold bg-primary text-white'>
                        {user?.fullname?.charAt(0).toUpperCase()}
                     </AvatarFallback>
                  </Avatar>

                  <div className='flex-1 sm:pb-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                     <div>
                        <Title className='text-xl font-bold leading-tight'>{user?.fullname || "User"}</Title>
                        <Paragraph size='sm' className='text-muted-foreground'>
                           {user?.email}
                        </Paragraph>
                     </div>
                  </div>
               </div>

               {/* Quick info strip */}
               <div className='border-t border-outline bg-primary/5 px-6 py-3 flex flex-wrap gap-x-6 gap-y-2'>
                  <div className='flex items-center gap-1.5'>
                     <User className='size-4 text-blue-500' />
                     <Paragraph size='sm' variant='default'>
                        {user?.username}
                     </Paragraph>
                  </div>
                  <div className='flex items-center gap-1.5'>
                     <ShieldCheck className='size-4 text-emerald-500' />
                     <Paragraph size='sm' variant='default' className='capitalize'>
                        {user?.role}
                     </Paragraph>
                  </div>
                  <div className='flex items-center gap-1.5'>
                     <CalendarDays className='size-4 text-amber-500' />
                     <Paragraph size='sm' variant='default'>
                        Joined {dateParser(user?.created_at, "PP")}
                     </Paragraph>
                  </div>
               </div>
            </div>

            {/* ── Settings Card ── */}
            <div className='rounded-xl border border-outline bg-white shadow-sm overflow-hidden'>
               {/* ─ Personal Information ─ */}
               <AccountSection
                  editable
                  sectionKey='personalInfo'
                  contentClassName='grid grid-cols-1 gap-4'
                  title='Personal Information'
                  description='Update your name and email address.'
                  icon={<UserRound className='size-4 lg:size-6 text-muted-foreground' />}
                  className='border-none rounded-none border-b border-outline'
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
                     icon={<User className='size-4' />}
                  />
                  <EditableDetails
                     name='email'
                     label='Email'
                     description={user?.email || "No email available."}
                     isEdit={editableSections.personalInfo}
                     icon={<Mail className='size-4' />}
                  />
               </AccountSection>

               {/* ─ Account Details ─ */}
               <AccountSection
                  editable
                  sectionKey='accountDetails'
                  contentClassName='grid grid-cols-1 sm:grid-cols-2 gap-4'
                  title='Account Details'
                  description='View your role, username, and account status.'
                  icon={<IdCard className='size-4 lg:size-6 text-muted-foreground' />}
                  className='border-none rounded-none'
                  onSubmit={onUpdateAccountDetails}
                  schema={accountDetailsSchema}
                  defaultValues={{
                     username: user?.username || "",
                  }}
               >
                  <Details
                     label='User Role'
                     description={user?.role || "User"}
                     icon={<ShieldCheck className='size-4' />}
                  />
                  <EditableDetails
                     label='Username'
                     name='username'
                     description={user?.username || "User"}
                     isEdit={editableSections.accountDetails}
                     icon={<AtSign className='size-4' />}
                  />
                  <Details
                     label='Date Joined'
                     description={dateParser(user?.created_at, "PPPP")}
                     icon={<CalendarDays className='size-4' />}
                  />
                  <Details
                     label='Account Status'
                     icon={<CircleDot className='size-4' />}
                     description={
                        <Badge className='mt-1' variant={user?.status === "active" ? "success" : "destructive"}>
                           {user?.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                     }
                  />
               </AccountSection>

               {/* ─ Security ─ */}
               <div className='border-t border-outline'>
                  <div className='flex items-center gap-3 px-6 py-3 bg-muted/30 border-b border-outline'>
                     <div className='rounded-lg bg-background border border-outline p-1.5 shrink-0'>
                        <ShieldCheck className='size-4 lg:size-6 text-muted-foreground' />
                     </div>
                     <div>
                        <Paragraph
                           size='lg'
                           variant='default'
                           className='max-md:text-sm! max-lg:text-base! font-semibold'
                        >
                           Security
                        </Paragraph>
                        <Paragraph size='sm' className='max-md:text-xs! text-muted-foreground'>
                           Manage your password and account security preferences.
                        </Paragraph>
                     </div>
                  </div>
                  <div className='px-4 py-5 space-y-3'>
                     <div className='flex items-center justify-between gap-4 rounded-lg bg-muted/80 border border-outline/50 px-4 py-3'>
                        <div className='flex items-center gap-3'>
                           <div className='rounded-md bg-blue-50 p-2 border border-blue-100'>
                              <KeyRound className='size-4.5 text-blue-500' />
                           </div>
                           <div>
                              <Paragraph size='sm' variant='default' className='font-medium'>
                                 Password
                              </Paragraph>
                              <Paragraph size='xs'>New password will be sent to your email.</Paragraph>
                           </div>
                        </div>
                        <IButton variant='outline' size='sm' className='text-xs shrink-0' onClick={onResetPassword}>
                           Reset
                        </IButton>
                     </div>

                     <div className='flex items-center justify-between gap-4 rounded-lg bg-muted/80 border border-outline/50 px-4 py-3'>
                        <div className='flex items-center gap-3'>
                           <div className='rounded-md bg-emerald-50 p-2 border border-emerald-100'>
                              <ShieldCheck className='size-4.5 text-emerald-500' />
                           </div>
                           <div>
                              <Paragraph size='sm' variant='default' className='font-medium'>
                                 Two-Factor Authentication
                              </Paragraph>
                              <Paragraph size='xs'>Currently disabled</Paragraph>
                           </div>
                        </div>
                        <IButton variant='outline' size='sm' className='text-xs shrink-0'>
                           Manage
                        </IButton>
                     </div>

                     <div className='flex items-center justify-between gap-4 rounded-lg bg-muted/80 border border-outline/50 px-4 py-3'>
                        <div className='flex items-center gap-3'>
                           <div className='rounded-md bg-amber-50 p-2 border border-amber-100'>
                              <Mail className='size-4.5 text-amber-500' />
                           </div>
                           <div>
                              <Paragraph size='sm' variant='default' className='font-medium'>
                                 Notifications
                              </Paragraph>
                              <Paragraph size='xs'>Currently disabled</Paragraph>
                           </div>
                        </div>
                        <IButton variant='outline' size='sm' className='text-xs shrink-0'>
                           Manage
                        </IButton>
                     </div>
                  </div>
               </div>
            </div>
         </main>
      </PageLayout>
   );
}
