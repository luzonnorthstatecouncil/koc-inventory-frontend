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
      logout: clearStates(initialState),
   },
});

export const { setUser, setSession, setOpenViewModal, setOpenCreateModal, setOpenEditModal, setSelectedUser, logout } =
   userSlice.actions;
export default userSlice.reducer;
