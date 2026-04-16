import { useSignOutUserMutation } from "@/features/api/auth";
import { setUser } from "@/features/slice/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCatchQuery } from "./useCatchQuery";
import getToken from "../helpers/getToken";
import { toast } from "sonner";

export const useLogout = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();
   const [signOutUser] = useSignOutUserMutation();
   const exec = useCatchQuery();
   const token = getToken();

   const logout = async (fullReload = false) => {
      try {
         const id = toast.loading("Signing you out...");
         await exec(signOutUser, { token });
         toast.dismiss(id);
      } finally {
         localStorage.removeItem("token");
         dispatch(setUser({ user: null, token: null }));

         if (fullReload) {
            window.location.href = "/login";
            return;
         }

         navigate("/login", { replace: true });
      }
   };

   return logout;
};
