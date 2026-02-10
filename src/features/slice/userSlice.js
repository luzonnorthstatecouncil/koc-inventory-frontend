// userSlice.js
import { clearStates, setState } from "@/helpers/sliceHelpers";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
   token: null,
   user: null,
   session: null,

   openViewModal: false,
   openCreateModal: false,
   openEditModal: false,
   selectedUser: null,
   
   credentials: null,
   showCredentialsModal: false,
};

const userSlice = createSlice({
   name: "user",
   initialState,
   reducers: {
      setUser: setState(),
      setSession: setState("session"),
      setOpenViewModal: setState("openViewModal"),
      setOpenCreateModal: setState("openCreateModal"),
      setOpenEditModal: setState("openEditModal"),
      setSelectedUser: setState("selectedUser"),
      setCredentials: setState("credentials"),
      setShowCredentialsModal: setState("showCredentialsModal"),
      logout: clearStates(initialState),
   },
});

export const { setUser, setSession, setOpenViewModal, setOpenCreateModal, setOpenEditModal, setSelectedUser, setCredentials, setShowCredentialsModal, logout } =
   userSlice.actions;
export default userSlice.reducer;
