import { useSelector } from "react-redux";

const getToken = () => {
	const tokenRedux = useSelector((state) => state.user.token);
	const tokenLocal = localStorage.getItem("token");
	return tokenRedux || tokenLocal;
};

export default getToken;
