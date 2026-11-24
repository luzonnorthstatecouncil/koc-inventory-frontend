import { useSelector } from "react-redux";

/**
 * Current auth token: the Redux copy after login, falling back to localStorage after a reload.
 * A hook (it reads the store), so it must be called at the top level of a component or hook.
 */
export const useToken = () => {
   const tokenRedux = useSelector((state) => state.user.token);
   return tokenRedux || localStorage.getItem("token");
};
