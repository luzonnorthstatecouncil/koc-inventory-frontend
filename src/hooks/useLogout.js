import { useSignOutUserMutation } from "@/features/api/auth";
import { baseApi } from "@/features/api/baseApi";
import { setUser } from "@/features/slice/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCatchQuery } from "./useCatchQuery";
import { useToken } from "./useToken";
import { toast } from "sonner";

export const useLogout = () => {
   const dispatch = useDispatch();
   const navigate = useNavigate();
   const [signOutUser] = useSignOutUserMutation();
   const exec = useCatchQuery();
   const token = useToken();

   const logout = async (fullReload = false) => {
      const id = toast.loading("Signing you out...");
      try {
         await exec(signOutUser, { token });
      } catch {
         // The local session is cleared below regardless of whether the server call succeeded
      } finally {
         toast.dismiss(id);
      }

      localStorage.removeItem("token");
      dispatch(setUser({ user: null, token: null }));
      // Drop every cached response so the next person on this terminal starts clean
      dispatch(baseApi.util.resetApiState());

      if (fullReload) {
         window.location.href = "/login";
      } else {
         navigate("/login", { replace: true });
      }
   };

   return logout;
};
