import PageLayout from "@/layout/PageLayout";
import { HOME, USER_MANAGEMENT } from "@/constants/routes";
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
import EditUser from "@/components/modals/user/Edit";
import { useConfirmation } from "@/helpers/confirmAction";
import { toast } from "sonner";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import CreateUser from "@/components/modals/user/Create";
import UserCredentialsModal from "@/components/modals/user/UserCredentialsModal";
import { UserChangePasswordModal } from "@/components/modals/user/UserChangePassword";

const ROLE_STYLES = {
   admin: "bg-primary/10 text-primary",
   cashier: "bg-violet-50 text-violet-700",
   staff: "bg-blue-50 text-blue-700",
};

function avatarColor(name = "") {
   const palette = [
      "bg-rose-100 text-rose-700",
      "bg-orange-100 text-orange-700",
      "bg-amber-100 text-amber-700",
      "bg-emerald-100 text-emerald-700",
      "bg-cyan-100 text-cyan-700",
      "bg-blue-100 text-blue-700",
      "bg-violet-100 text-violet-700",
      "bg-pink-100 text-pink-700",
   ];
   let hash = 0;
   for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
   return palette[Math.abs(hash) % palette.length];
}

const columns = [
   {
      key: "full_name",
      title: "User",
      render: (value, item) => {
         const initials = `${value?.charAt(0) ?? ""}${value?.split(" ")[1]?.charAt(0) ?? ""}`.toUpperCase();
         return (
            <div className='flex items-center gap-3'>
               <div
                  className={`flex-shrink-0 size-9 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor(value)}`}
               >
                  {initials}
               </div>
               <div className='min-w-0'>
                  <p className='font-semibold text-sm text-foreground leading-tight truncate'>{value}</p>
                  <p className='text-sm text-muted-foreground truncate'>{item.user?.email}</p>
               </div>
            </div>
         );
      },
   },
   {
      key: "role",
      title: "Role",
      render: (value) => {
         const style = ROLE_STYLES[value?.toLowerCase()] ?? "bg-gray-100 text-gray-600";
         return (
            <span
               className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${style}`}
            >
               {value}
            </span>
         );
      },
   },
   {
      key: "status",
      title: "Status",
      render: (value) => {
         const isActive = value === "active";
         return (
            <span
               className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
            >
               <span className={`size-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
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
         className: "text-blue-600",
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
            {openEditModal && <EditUser isOpen={openEditModal} onClose={onEditClose} />}
            {openCreateModal && <CreateUser isOpen={openCreateModal} onClose={onCreateClose} />}

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
