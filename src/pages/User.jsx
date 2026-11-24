import PageLayout from "@/layout/PageLayout";
import { USER_MANAGEMENT } from "@/constants/routes";
import { EditIcon, EyeIcon, Lock, TrashIcon } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { useDeleteUserMutation, useGetUserListQuery } from "@/features/api/users";
import ViewUser from "@/components/modals/user/View";
import { useDispatch, useSelector } from "react-redux";
import {
   setOpenCreateModal,
   setOpenEditModal,
   setOpenViewModal,
   setSelectedUser,
   setCredentials,
   setShowCredentialsModal,
   setOpenChangePasswordModal,
} from "@/features/slice/userSlice";
import { useConfirmation } from "@/helpers/confirmAction";
import { toast } from "sonner";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import ManageUser from "@/components/modals/user/ManageUser";
import { ROLE_OPTIONS } from "@/constants/options.js";
import { cn } from "@/lib/utils";
import UserCredentialsModal from "@/components/modals/user/UserCredentialsModal";
import { UserChangePasswordModal } from "@/components/modals/user/UserChangePassword";

const roleLabel = (role) => ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role ?? "—";

const columns = [
   {
      key: "full_name",
      title: "User",
      render: (value, item) => (
         <div className='flex min-w-0 flex-col gap-0.5'>
            <span className='block truncate text-sm font-semibold text-foreground'>{value}</span>
            <span className='block truncate text-xs text-neutral-500'>{item.email || item.user?.email || item.username}</span>
         </div>
      ),
   },
   {
      key: "role",
      title: "Role",
      width: "160px",
      render: (value) => <span className='text-sm font-medium text-foreground'>{roleLabel(value)}</span>,
   },
   {
      key: "status",
      title: "Status",
      width: "140px",
      render: (value) => {
         const isActive = value === "active";
         return (
            <span className={cn("inline-flex items-center gap-2 text-sm font-medium", isActive ? "text-neutral-700" : "text-neutral-500")}>
               <span className={cn("size-2 rounded-full", isActive ? "bg-emerald-500" : "bg-neutral-300")} aria-hidden='true' />
               {isActive ? "Active" : "Inactive"}
            </span>
         );
      },
   },
];

const userFilters = [
   {
      key: "status",
      label: "Status",
      options: [
         { value: "active", label: "Active" },
         { value: "inactive", label: "Inactive" },
      ],
   },
];

export default function UserManagement() {
   const dispatch = useDispatch();
   const { confirm } = useConfirmation();
   const exec = useCatchQuery();
   const [deleteUser] = useDeleteUserMutation();
   const { openViewModal, openEditModal, openCreateModal, openChangePasswordModal, credentials, showCredentialsModal } =
      useSelector((state) => state.user);

   const onViewClose = () => {
      dispatch(setOpenViewModal(false));
      dispatch(setSelectedUser(null));
   };

   const onViewUser = (user) => {
      dispatch(setOpenViewModal(true));
      dispatch(setSelectedUser(user));
   };

   const onEditClose = () => {
      dispatch(setOpenEditModal(false));
      dispatch(setSelectedUser(null));
   };

   const onEditUser = (user) => {
      dispatch(setOpenEditModal(true));
      dispatch(setSelectedUser(user));
   };

   const onCreateUser = () => {
      dispatch(setOpenCreateModal(true));
   };

   const onCreateClose = () => {
      dispatch(setOpenCreateModal(false));
   };

   const onChangePasswordClose = () => {
      dispatch(setOpenChangePasswordModal(false));
      dispatch(setSelectedUser(null));
   };

   const onDeleteUser = async (user) => {
      const confirmed = await confirm({
         title: "Confirm User Deletion",
         message: `Are you sure you want to delete the account of ${user.full_name}? This action cannot be undone.`,
         variant: "destructive",
      });

      if (!confirmed) return;

      const id = toast.loading("Deleting user...");
      const { success, message } = await exec(deleteUser, user.id);

      if (!success) return;

      toast.success(message, { id });
   };

   const onOpenChangePassword = (user) => {
      dispatch(setSelectedUser(user));
      dispatch(setOpenChangePasswordModal(true));
   };

   const actions = [
      {
         key: "view",
         label: "View User",
         icon: EyeIcon,
         action: onViewUser,
      },
      {
         key: "edit",
         label: "Edit User",
         icon: EditIcon,
         action: onEditUser,
      },
      {
         key: "change_password",
         label: "Change Password",
         icon: Lock,
         action: onOpenChangePassword,
      },
      {
         key: "delete",
         label: "Delete User",
         icon: TrashIcon,
         className: "text-destructive",
         action: onDeleteUser,
      },
   ];

   return (
      <PageLayout
         pageTitle={USER_MANAGEMENT.title}
         pageDescription='Manage users and their permissions within the inventory system. Create new accounts, edit existing ones, and reset passwords as needed to ensure smooth operations.'
         route={USER_MANAGEMENT}
      >
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetUserListQuery,
                  params: {
                     status: "active",
                  },
                  options: {
                     refetchOnMountOrArgChange: true,
                  },
               }}
               columns={columns}
               wrapperClassName='mt-2'
               filterable={true}
               filters={userFilters}
               actions={actions}
               actionButtons={[
                  {
                     label: "New User",
                     onClick: onCreateUser,
                  },
               ]}
            />

            {openViewModal && <ViewUser isOpen={openViewModal} onClose={onViewClose} />}
            {openEditModal && <ManageUser isEditing isOpen={openEditModal} onClose={onEditClose} />}
            {openCreateModal && <ManageUser isOpen={openCreateModal} onClose={onCreateClose} />}

            {showCredentialsModal && credentials && (
               <UserCredentialsModal
                  isOpen={showCredentialsModal}
                  onClose={() => {
                     dispatch(setShowCredentialsModal(false));
                     dispatch(setCredentials(null));
                  }}
                  username={credentials.username}
                  password={credentials.password}
               />
            )}

            {openChangePasswordModal && (
               <UserChangePasswordModal isOpen={openChangePasswordModal} onClose={onChangePasswordClose} />
            )}
         </main>
      </PageLayout>
   );
}
