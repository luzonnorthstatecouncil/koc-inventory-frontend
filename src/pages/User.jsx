import PageLayout from "@/layout/PageLayout";
import { HOME, USER_MANAGEMENT } from "@/constants/routes";
import { EditIcon, EyeIcon, Lock, Plus, TrashIcon, User2, Warehouse } from "lucide-react";
import DataTable from "@/components/custom/Datatable";
import { Badge } from "@/components/ui/badge";
import { useDeleteUserMutation, useGetUserListQuery, useResetPasswordMutation } from "@/features/api/users";
import ViewUser from "@/components/modals/user/View";
import { useDispatch, useSelector } from "react-redux";
import { setOpenCreateModal, setOpenEditModal, setOpenViewModal, setSelectedUser } from "@/features/slice/userSlice";
import EditUser from "@/components/modals/user/Edit";
import { useConfirmation } from "@/helpers/confirmAction";
import { toast } from "sonner";
import { useCatchQuery } from "@/hooks/useCatchQuery";
import CreateUser from "@/components/modals/user/Create";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Paragraph from "@/components/custom/Paragraph";

const breadcrumbItems = [{ label: HOME.title }, { label: USER_MANAGEMENT.title }];

const columns = [
   {
      key: "full_name",
      title: "User",
      render: (value, item) => (
         <div className='flex items-center gap-3'>
            <Avatar>
               <AvatarImage src={null} />
               <AvatarFallback>
                  {value?.charAt(0).toUpperCase()}
                  {value?.split(" ")[1]?.charAt(0).toUpperCase()}
               </AvatarFallback>
            </Avatar>
            <div>
               <p>{value}</p>
               <Paragraph>{item.user?.email}</Paragraph>
            </div>
         </div>
      ),
   },
   {
      key: "role",
      title: "Role",
      render: (value) => (
         <Badge variant='outline' className='capitalize'>
            {value}
         </Badge>
      ),
   },
   {
      key: "status",
      title: "Status",
      render: (value) => (
         <Badge variant={value === "active" ? "success" : "secondary"}>
            {value === "active" ? "Active" : "Inactive"}
         </Badge>
      ),
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
   const [resetPassword] = useResetPasswordMutation();
   const [deleteUser] = useDeleteUserMutation();
   const { openViewModal, openEditModal, openCreateModal } = useSelector((state) => state.user);

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

   const onResetPassword = async (selectedUser) => {
      const confirmed = await confirm({
         title: "Confirm Password Reset",
         confirmLabel: "Reset Password",
         message: `Are you sure you want to reset the password for ${selectedUser.full_name}?`,
      });

      if (!confirmed) return;

      const id = toast.loading("Resetting password...");
      const { success, message } = await exec(resetPassword, selectedUser.id);

      if (!success) {
         toast.dismiss(id);
         return;
      }

      toast.success(message, { id });
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
         key: "reset_password",
         label: "Reset Password",
         icon: Lock,
         className: "text-blue-600",
         action: onResetPassword,
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
      <PageLayout breadcrumbItems={breadcrumbItems} pageTitle={USER_MANAGEMENT.title} route={USER_MANAGEMENT}>
         <main className='p-1 sm:p-2 w-full'>
            <DataTable
               query={{
                  useQuery: useGetUserListQuery,
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
         </main>
      </PageLayout>
   );
}
