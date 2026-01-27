import { useCheckSessionQuery } from "@/features/api/auth";
import { useSelector, useDispatch } from "react-redux";
import { setSession, setUser } from "@/features/slice/userSlice";
import { useEffect } from "react";
import { toast } from "sonner";
import { useLogout } from "./useLogout";
import getToken from "../helpers/getToken";
import { useGetAuthUserQuery } from "@/features/api/users";

export const useUser = () => {
   const dispatch = useDispatch();
   const logout = useLogout();
   const token = getToken();
   const location = window.location.pathname;

   const { user, session } = useSelector((state) => state.user);

   const {
      data: appSession,
      isError: isSessionError,
      error: sessionError,
   } = useCheckSessionQuery(
      {},
      {
         skip: location === "/login" || session,
         refetchOnMountOrArgChange: true,
      },
   );

   const {
      data: userProfile,
      isSuccess,
      isError: isUserError,
      error: userError,
   } = useGetAuthUserQuery(
      { appToken: token },
      {
         skip: !token || isSessionError,
         refetchOnMountOrArgChange: false,
         refetchOnFocus: false,
         refetchOnReconnect: false,
      },
   );

   useEffect(() => {
      if (!session) {
         dispatch(setSession(appSession));
      }
   }, [session, dispatch]);

   useEffect(() => {
      if (isSuccess && userProfile) {
         if (!userProfile.id && token) {
            localStorage.removeItem("token");
            logout();
            return;
         }

         dispatch(setUser({ user: userProfile || user }));
      }

      if (isUserError || isSessionError) {
         if (isUserError) toast.error(userError?.data?.message);
         if (isSessionError) toast.error(sessionError?.data?.message);

         setTimeout(() => {
            localStorage.removeItem("token");
            logout(true);
         }, 1500);
      }
   }, [isSuccess, isUserError, isSessionError, user, userProfile, dispatch]);

   return user;
};
