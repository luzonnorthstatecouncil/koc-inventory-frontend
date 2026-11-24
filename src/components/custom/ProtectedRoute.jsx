import { useToken } from "@/hooks/useToken";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ element }) {
	const token = useToken();

	if (!token) {
		return (
			<Navigate
				to='/login'
				replace
			/>
		);
	}

	return element;
}
